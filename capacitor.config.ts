import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fx.app',
  appName: 'image-overlay-app',
  webDir: 'build',
  android: {
    backgroundColor: "#FFFFFF",
    statusBarStyle: 'dark',
    statusBarBackgroundColor: "#FFFFFF"
  }
};

export default config;
