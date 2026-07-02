import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { TicketDetailView } from '@/components/ticket/TicketDetailView';
import { enterUp, IconButton, Screen, ScreenHeader } from '@/components/ui';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const ticketId = Array.isArray(id) ? id[0] : id;

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="Ticket detail"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Saved Slip"
        />
      </Animated.View>

      <TicketDetailView ticketId={ticketId} />
    </Screen>
  );
}
