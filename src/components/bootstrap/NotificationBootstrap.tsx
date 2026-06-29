import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useRegisterPushDeviceMutation } from '@/lib/api/hooks';
import { expoProjectId } from '@/lib/config';
import { getMobileDeviceInput } from '@/lib/device';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications() {
  if (Platform.OS === 'web') {
    return { permission: 'unsupported' as const };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'BetClaw',
    });
  }

  if (!Device.isDevice) {
    return { permission: 'unsupported' as const };
  }

  const projectId =
    expoProjectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    return { permission: 'missing-project-id' as const };
  }

  const current = await Notifications.getPermissionsAsync();
  const finalStatus =
    current.status === 'granted'
      ? current.status
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') {
    return { permission: 'denied' as const };
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return { permission: 'granted' as const, token: token.data };
}

export function NotificationBootstrap() {
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const notificationsRegistered = useNotificationStore((state) => state.registered);
  const registrationUserId = useNotificationStore((state) => state.registrationUserId);
  const setNotificationState = useNotificationStore((state) => state.setNotificationState);
  const registerDevice = useRegisterPushDeviceMutation();
  const registerPushDeviceRef = useRef(registerDevice.mutateAsync);
  const registrationInFlight = useRef(false);

  useEffect(() => {
    registerPushDeviceRef.current = registerDevice.mutateAsync;
  }, [registerDevice.mutateAsync]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as any);
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !userId) return;
    if ((notificationsRegistered && registrationUserId === userId) || registrationInFlight.current) return;

    let mounted = true;
    registrationInFlight.current = true;

    registerForPushNotifications()
      .then(async (result) => {
        if (!mounted) return;

        setNotificationState({
          error: null,
          expoPushToken: 'token' in result ? result.token : null,
          permission: result.permission,
        });

        if ('token' in result && result.token) {
          await registerPushDeviceRef.current({
            expoPushToken: result.token,
            ...(await getMobileDeviceInput()),
          });
          if (mounted) {
            setNotificationState({ registered: true, registrationUserId: userId });
          }
        } else if (mounted) {
          setNotificationState({ registered: false, registrationUserId: null });
        }
      })
      .catch((error) => {
        if (!mounted) return;
        setNotificationState({
          error: error instanceof Error ? error.message : 'Notification setup failed',
          registered: false,
          registrationUserId: null,
        });
      })
      .finally(() => {
        registrationInFlight.current = false;
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, notificationsRegistered, registrationUserId, setNotificationState, userId]);

  return null;
}
