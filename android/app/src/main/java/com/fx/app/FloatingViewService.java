package com.fx.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.IBinder;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FloatingViewService extends Service {
    private WindowManager windowManager;
    private View floatingView;
    private TextView timerText;
    private TextView timeText;
    private TextView millisText;
    private Handler handler = new Handler();
    private int time = 0;
    private int colorIndex = 0;
    private final String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"};
    private int initialX;
    private int initialY;
    private float initialTouchX;
    private float initialTouchY;
    private long lastClickTime = 0;
    private static final long DOUBLE_CLICK_TIME_DELTA = 300; // 双击间隔时间（毫秒）
    private boolean isResizing = false;
    private static final int RESIZE_AREA = 50; // 左下角调整大小的触摸区域大小
    private float initialWidth;
    private float initialHeight;
    private static final String PREFS_NAME = "FloatingViewPrefs";
    private static final String KEY_WIDTH = "window_width";
    private static final String KEY_HEIGHT = "window_height";
    private static final String KEY_POSITION_X = "position_x";
    private static final String KEY_POSITION_Y = "position_y";
    private String lastTimeValue = "";
    private String lastMillisValue = "";
    private static final float HISTORY_ALPHA = 0.3f; // 历史值的透明度

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        
        floatingView = LayoutInflater.from(this).inflate(R.layout.layout_floating_view, null);
        timeText = floatingView.findViewById(R.id.timeText);
        millisText = floatingView.findViewById(R.id.millisText);
        
        // 初始化时就设置历史值为当前时间
        SimpleDateFormat timeSdf = new SimpleDateFormat("HH:mm:ss", Locale.getDefault());
        SimpleDateFormat millisSdf = new SimpleDateFormat(".SS", Locale.getDefault());
        Date now = new Date();
        lastTimeValue = timeSdf.format(now);
        lastMillisValue = millisSdf.format(now);
        
        // 添加初始空行，确保一开始就是两行高度
        timeText.setText("\n" + getCurrentTime());
        millisText.setText("\n" + getCurrentMillis());

        // 读取保存的配置，修改初始高度为两行高度
        android.content.SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        int savedWidth = prefs.getInt(KEY_WIDTH, 300);  // 增加默认宽度
        int savedHeight = prefs.getInt(KEY_HEIGHT, 120); // 修改默认高度为120
        int savedX = prefs.getInt(KEY_POSITION_X, 0);
        int savedY = prefs.getInt(KEY_POSITION_Y, 100);

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                savedWidth,  // 使用保存的宽度
                savedHeight, // 使用保存的高度
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );
        params.x = savedX;  // 使用保存的位置
        params.y = savedY;

        // 修改主视图的触摸监听，处理拖拽和调整大小
        floatingView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                float touchX = event.getX();
                float touchY = event.getY();
                boolean inResizeArea = touchX >= (floatingView.getWidth() - RESIZE_AREA) && 
                                     touchY >= (floatingView.getHeight() - RESIZE_AREA);

                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        if (inResizeArea) {
                            isResizing = true;
                            initialWidth = floatingView.getWidth();
                            initialHeight = floatingView.getHeight();
                        } else {
                            // 处理双击和拖动
                            long clickTime = System.currentTimeMillis();
                            if (clickTime - lastClickTime < DOUBLE_CLICK_TIME_DELTA) {
                                Intent intent = new Intent(FloatingViewService.this, MainActivity.class);
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                                return true;
                            }
                            lastClickTime = clickTime;
                            initialX = params.x;
                            initialY = params.y;
                        }
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        if (isResizing) {
                            float deltaX = event.getRawX() - initialTouchX;
                            float deltaY = event.getRawY() - initialTouchY;
                            
                            // 调整最小和最大尺寸限制
                            int newWidth = Math.max(200, Math.min(1000, (int)(initialWidth + deltaX)));
                            int newHeight = Math.max(100, Math.min(500, (int)(initialHeight + deltaY)));
                            
                            // 保持宽高比例约为3:1
                            float ratio = 3.0f;
                            if (newWidth / newHeight > ratio) {
                                newWidth = (int)(newHeight * ratio);
                            } else {
                                newHeight = (int)(newWidth / ratio);
                            }
                            
                            params.width = newWidth;
                            params.height = newHeight;
                            
                            // 强制重新布局以触发文本自动缩放
                            windowManager.updateViewLayout(floatingView, params);
                            floatingView.requestLayout();
                            return true;
                        } else {
                            // 移动位置
                            params.x = initialX + (int) (event.getRawX() - initialTouchX);
                            params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        }
                        windowManager.updateViewLayout(floatingView, params);
                        return true;

                    case MotionEvent.ACTION_UP:
                        isResizing = false;
                        // 确保在调整大小和移动后立即保存配置
                        saveWindowConfig(params);
                        break;
                }
                return false;
            }
        });

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        windowManager.addView(floatingView, params);

        // 启动计时器更新
        startTimer();
    }

    // 添加新方法用于保存窗口配置
    private void saveWindowConfig(WindowManager.LayoutParams params) {
        android.content.SharedPreferences.Editor editor = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit();
        editor.putInt(KEY_WIDTH, params.width);
        editor.putInt(KEY_HEIGHT, params.height);
        editor.putInt(KEY_POSITION_X, params.x);
        editor.putInt(KEY_POSITION_Y, params.y);
        editor.apply();
    }

    private void startTimer() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                updateTimerText();
                handler.postDelayed(this, 10);
            }
        }, 10);

        // 颜色变化计时器 - 修改历史值记录逻辑
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                SimpleDateFormat timeSdf = new SimpleDateFormat("HH:mm:ss", Locale.getDefault());
                SimpleDateFormat millisSdf = new SimpleDateFormat(".SS", Locale.getDefault());
                Date now = new Date();
                
                // 更新历史值为当前值
                lastTimeValue = timeSdf.format(now);
                lastMillisValue = millisSdf.format(now);
                
                // 更新颜色
                colorIndex = (colorIndex + 1) % colors.length;
                String currentColor = colors[colorIndex];
                timeText.setTextColor(Color.parseColor(currentColor));
                millisText.setTextColor(Color.parseColor(currentColor));
                
                handler.postDelayed(this, 4250);
            }
        }, 4250);
    }

    private String getCurrentTime() {
        return new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
    }

    private String getCurrentMillis() {
        return new SimpleDateFormat(".SS", Locale.getDefault()).format(new Date());
    }

    private void updateTimerText() {
        String currentTime = getCurrentTime();
        String currentMillis = getCurrentMillis();

        // 构建带历史值的SpannableString，确保只显示一次历史
        if (!lastTimeValue.isEmpty()) {
            int historyColor = Color.argb((int)(HISTORY_ALPHA * 255), 255, 255, 255);
            String currentColor = colors[colorIndex];
            
            // 重置历史和当前时间的显示
            android.text.SpannableString timeSpannable = new android.text.SpannableString(
                    lastTimeValue + "\n" + currentTime);
            timeSpannable.setSpan(new android.text.style.ForegroundColorSpan(historyColor),
                    0, lastTimeValue.length(),
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            timeSpannable.setSpan(new android.text.style.ForegroundColorSpan(Color.parseColor(currentColor)),
                    lastTimeValue.length() + 1, timeSpannable.length(),
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            
            android.text.SpannableString millisSpannable = new android.text.SpannableString(
                    lastMillisValue + "\n" + currentMillis);
            millisSpannable.setSpan(new android.text.style.ForegroundColorSpan(historyColor),
                    0, lastMillisValue.length(),
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            millisSpannable.setSpan(new android.text.style.ForegroundColorSpan(Color.parseColor(currentColor)),
                    lastMillisValue.length() + 1, millisSpannable.length(),
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            
            timeText.setText(timeSpannable);
            millisText.setText(millisSpannable);
        } else {
            timeText.setText(String.format("\n%s", currentTime));
            millisText.setText(String.format("\n%s", currentMillis));
        }
    }

    @Override
    public void onDestroy() {
        // 确保在服务销毁前保存当前配置
        if (floatingView != null) {
            WindowManager.LayoutParams params = (WindowManager.LayoutParams) floatingView.getLayoutParams();
            if (params != null) {
                saveWindowConfig(params);
            }
            handler.removeCallbacksAndMessages(null);
            windowManager.removeView(floatingView);
        }
        super.onDestroy();
    }
}
