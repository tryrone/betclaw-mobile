import { create } from 'zustand';

type NotificationState = {
  error: string | null;
  expoPushToken: string | null;
  permission: 'idle' | 'granted' | 'denied' | 'missing-project-id' | 'unsupported';
  registered: boolean;
  registrationUserId: string | null;
  resetNotificationState: () => void;
  setNotificationState: (state: Partial<Omit<NotificationState, 'resetNotificationState' | 'setNotificationState'>>) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  error: null,
  expoPushToken: null,
  permission: 'idle',
  registered: false,
  registrationUserId: null,
  resetNotificationState: () =>
    set({
      error: null,
      expoPushToken: null,
      permission: 'idle',
      registered: false,
      registrationUserId: null,
    }),
  setNotificationState: (state) => set(state),
}));
