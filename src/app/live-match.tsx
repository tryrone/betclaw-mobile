import { Redirect } from 'expo-router';

import { liveMatch } from '@/data/mock';

export default function LiveMatchScreen() {
  return <Redirect href={`/match/${liveMatch.id}` as any} />;
}
