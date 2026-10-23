import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { mediaUrl } from '@/lib/api';

const PALETTE = ['#c8312b', '#93600f', '#24784b', '#2f6fd0', '#8a4fbf', '#8e5383', '#0d7a7a', '#85621c'];

/** Màu nền cố định theo người dùng (cùng công thức với web). */
function colorOf(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Ảnh đại diện; chưa có ảnh (hoặc ảnh lỗi) thì hiện chữ cái đầu của tên trên nền màu. */
export function Avatar({
  user,
  size = 32,
}: {
  user: { id?: string; displayName?: string | null; avatarUrl?: string | null };
  size?: number;
}) {
  const src = mediaUrl(user.avatarUrl);
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (src && !failed) {
    return <Image source={src} style={box} contentFit="cover" onError={() => setFailed(true)} />;
  }
  const initial = Array.from((user.displayName || 'H').trim())[0]?.toUpperCase() ?? 'H';
  return (
    <View style={[styles.fallback, box, { backgroundColor: colorOf(user.id || user.displayName || 'hanni') }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#ffffff', fontWeight: '700' },
});
