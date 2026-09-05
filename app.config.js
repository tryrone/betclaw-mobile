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
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'betclaw',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.betclaw.app',
      buildNumber: '26',
      icon: './assets/images/ios-icon.png',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.betclaw.app',
      adaptiveIcon: {
        backgroundColor: '#11143b',
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
      eas: {
        projectId: 'bf4d6188-75ec-4fc9-87d0-76af5d0bf693',
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-mark.png',
          imageWidth: 150,
          resizeMode: 'contain',
          backgroundColor: '#f7f7f9',
          dark: {
            image: './assets/images/splash-mark-dark.png',
            backgroundColor: '#11143b',
          },
          ios: {
            image: './assets/images/splash-mark.png',
            imageWidth: 150,
            resizeMode: 'contain',
            backgroundColor: '#f7f7f9',
          },
          android: {
            image: './assets/images/splash-mark.png',
            imageWidth: 150,
            resizeMode: 'contain',
            backgroundColor: '#f7f7f9',
          },
        },
      ],
      'expo-font',
      'expo-image',
      'expo-notifications',
      'expo-web-browser',
      './plugins/with-ios-version-sync',
      ...(googlePlugin ? [googlePlugin] : []),
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
