import { Stack } from 'expo-router';

import { Loading } from '@/components/ui';
import { PremiumCheckout } from '@/features/premium/premium-checkout';
import { useRequireAuth } from '@/lib/auth';

export default function PremiumScreen() {
  const { user } = useRequireAuth();
  return (
    <>
      <Stack.Screen options={{ title: 'Hanni Premium' }} />
      {user ? <PremiumCheckout key={user.id} userId={user.id} /> : <Loading />}
    </>
  );
}
