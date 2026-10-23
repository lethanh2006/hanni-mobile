import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { Loading, Screen, TextLink } from '@/components/ui';
import { OnboardingResult } from '@/features/onboarding/onboarding-result';
import { OnboardingWizard, type ResultData } from '@/features/onboarding/onboarding-wizard';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/hooks';

/** Khảo sát 3 câu để chọn bài bắt đầu, lộ trình thi và mục tiêu ngày — làm được trước khi có tài khoản. */
export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const saved = useOnboarding(Boolean(user));
  const [result, setResult] = useState<ResultData | null>(null);
  const [redo, setRedo] = useState(false);

  const shown = result ?? (redo ? null : (saved.data ?? null));

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Thiết lập lộ trình',
          headerRight: () =>
            user ? (
              <TextLink title="Để sau" color="muted" onPress={() => router.dismissTo('/')} />
            ) : (
              <TextLink title="Đăng nhập" onPress={() => router.push('/login')} />
            ),
        }}
      />
      {loading || (user && saved.isLoading) ? (
        <Loading />
      ) : shown ? (
        <OnboardingResult
          data={shown}
          guest={!user}
          onRedo={() => {
            setResult(null);
            setRedo(true);
          }}
        />
      ) : (
        <OnboardingWizard loggedIn={Boolean(user)} onResult={setResult} />
      )}
    </Screen>
  );
}
