package com.fx.app;

import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.net.Uri;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (!Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, 1234);
        } else {
            startFloatingService();
            moveTaskToBack(true); // 将活动移到后台
        }
    }

    private void startFloatingService() {
        try {
            startService(new Intent(this, FloatingViewService.class));
        } catch (Exception e) {
            Toast.makeText(this, "启动服务失败: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 1234) {
            if (Settings.canDrawOverlays(this)) {
                startFloatingService();
                moveTaskToBack(true); // 获得权限后也移到后台
            } else {
                Toast.makeText(this, "需要悬浮窗权限才能显示计时器", Toast.LENGTH_LONG).show();
                finish(); // 如果没有权限就关闭应用
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }
}
