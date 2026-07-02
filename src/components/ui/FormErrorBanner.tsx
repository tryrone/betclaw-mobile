import { useEffect } from 'react';

import { useToast } from '@/components/ui/FloatingAlert';

/**
 * Bridges existing form error call sites to the global floating toast system.
 * Pairs with getErrorMessage(), which flattens Zod issues into lines.
 */
export function FormErrorBanner({ message }: { message?: string | null }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!message) return;
    showToast({
      message,
      title: 'Action needed',
      tone: 'error',
    });
  }, [message, showToast]);

  return null;
}
