import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tj.gov.eco.ecodoc',
  appName: 'EcoDoc',
  webDir: 'dist/public',
  server: {
    // Production server URL (Timeweb)
    url: 'http://176.98.176.158:5000',
    cleartext: true,
    // Используем http для WebView (не TWA/Chrome Custom Tabs)
    androidScheme: 'http',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
  },
  android: {
    // Отключаем features TWA для использования обычного WebView
    useLegacyBridge: true,
    appendUserAgent: 'EcoDoc-Android-App',
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  },
  ios: {
    contentInset: 'automatic',
  }
};

export default config;
