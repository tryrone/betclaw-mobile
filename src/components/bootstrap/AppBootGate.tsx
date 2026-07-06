import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BootSplash } from '@/components/bootstrap/BootSplash';
import { useInfiniteHomeFeed, useMe } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth-store';

/** Longest the loader will ever block the UI, even if a request stalls. */
const MAX_VISIBLE_MS = 7000;

function todayKey() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Full-screen branded loader shown after the native splash hides, while the
 * authenticated dashboard's core data is still being fetched. It renders as an
 * overlay above the navigator so screens mount (and fire their queries)
 * underneath, then fades out once the data settles. No-op for anonymous users.
 */
export function AppBootGate() {
  const status = useAuthStore((state) => state.status);
  const isAuthed = status === 'authenticated';

  // Warm the same cache entries the dashboard relies on so it renders instantly
  // once the loader clears. Query keys match the dashboard defaults, so these
  // dedupe with the screen's own queries.
  const me = useMe();
  const feed = useInfiniteHomeFeed({ date: todayKey(), limit: 24, windowDays: 1 });

  const [timedOut, setTimedOut] = useState(false);
  const [dismissed, setDismissed] = useState(!isAuthed);
  const opacity = useSharedValue(1);
  const fadingRef = useRef(false);

  const meSettled = me.isSuccess || me.isError;
  const feedSettled = feed.isSuccess || feed.isError;
  const ready = !isAuthed || timedOut || (meSettled && feedSettled);

  useEffect(() => {
    if (!isAuthed) return;
    const timer = setTimeout(() => setTimedOut(true), MAX_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [isAuthed]);

  useEffect(() => {
    if (!ready || fadingRef.current || dismissed) return;
    fadingRef.current = true;
    opacity.value = withTiming(0, { duration: 340 }, (finished) => {
      if (finished) runOnJS(setDismissed)(true);
    });
  }, [ready, dismissed, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (dismissed) return null;

  return (
    <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <BootSplash />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 100,
  },
});
