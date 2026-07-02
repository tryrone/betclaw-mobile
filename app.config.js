function requestedPlatform() {
  const platformFlagIndex = process.argv.findIndex((arg) => arg === '--platform' || arg === '-p');
  return platformFlagIndex >= 0 ? process.argv[platformFlagIndex + 1] : undefined;
}

function requiresIosGoogleConfig() {
  if (process.argv.includes('run:android')) return false;
  if (requestedPlatform() === 'android') return false;
  return process.argv.includes('prebuild') || process.argv.includes('run:ios');
}

function googleSignInPlugin() {
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

  if (!iosUrlScheme) {
    if (requiresIosGoogleConfig()) {
      throw new Error(
        'Missing EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME. Set it to the reversed iOS OAuth client ID before prebuilding native Google auth.',
      );
    }

    return null;
  }

  return [
    'react-native-nitro-google-signin',
    {
      iosUrlScheme,
    },
  ];
}

const googlePlugin = googleSignInPlugin();

module.exports = {
  expo: {
    name: 'BetClaw',
    slug: 'betclaw-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'betclaw',
    userInterfaceStyle: 'dark',
    ios: {
      bundleIdentifier: 'com.betclaw.app',
      icon: './assets/images/ios-icon.png',
    },
    android: {
      package: 'com.betclaw.app',
      adaptiveIcon: {
        backgroundColor: '#020605',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleIosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-mark.png',
          imageWidth: 150,
          resizeMode: 'contain',
          backgroundColor: '#020605',
          dark: {
            image: './assets/images/splash-mark.png',
            backgroundColor: '#020605',
          },
          ios: {
            image: './assets/images/splash-mark.png',
            imageWidth: 150,
            resizeMode: 'contain',
            backgroundColor: '#020605',
          },
          android: {
            image: './assets/images/splash-mark.png',
            imageWidth: 150,
            resizeMode: 'contain',
            backgroundColor: '#020605',
          },
        },
      ],
      'expo-font',
      'expo-notifications',
      ...(googlePlugin ? [googlePlugin] : []),
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
