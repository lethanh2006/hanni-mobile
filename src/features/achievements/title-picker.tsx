import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, ErrorNote, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { TitleShopCatalog } from '@/lib/types';

/**
 * `TitlePicker` của web: danh hiệu hiện cạnh tên trên hồ sơ và bảng xếp hạng. Mở theo huy hiệu đã đạt
 * (không mua bằng xu); chưa đạt thì ghi rõ cần đạt gì.
 */
export function TitlePicker() {
  const theme = useTheme();
  const { data, mutate } = useSWR<TitleShopCatalog>('/shop/titles');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;
  const owned = data.titles.filter((t) => t.owned).length;

  /** `key: null` = gỡ danh hiệu đang dùng. */
  async function equip(key: string | null) {
    if (busyKey) return;
    setBusyKey(key ?? 'none');
    setError(null);
    try {
      await api.post('/shop/titles/equip', { titleKey: key });
      await mutate();
    } catch {
      setError('Chưa đổi được danh hiệu. Thử lại sau nhé.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <AppText color="muted" style={styles.lead}>
        Đã mở{' '}
        <AppText weight="700">{owned}</AppText>/{data.titles.length} danh hiệu. Chọn 1 danh hiệu để hiện cạnh tên bạn
        trên hồ sơ và bảng xếp hạng.
      </AppText>
      {data.titles.map((t) => (
        <View
          key={t.key}
          style={[
            styles.row,
            t.equipped
              ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) }
              : { borderColor: theme.border },
          ]}>
          <View style={[styles.tile, { backgroundColor: t.owned ? alpha(theme.accent, 0.1) : theme.surface2 }]}>
            <Icon name={t.owned ? 'trophy' : 'lock'} size={17} color={t.owned ? 'accent' : 'muted'} />
          </View>
          <View style={styles.flex}>
            <AppText weight="600" color={t.owned ? 'text' : 'muted'}>
              {t.label}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.sub}>
              {t.equipped ? 'Đang dùng' : t.owned ? 'Đã mở' : `Cần: ${t.requirement}`}
            </AppText>
          </View>
          {t.owned && (
            <Button
              title={t.equipped ? 'Bỏ' : 'Dùng'}
              variant={t.equipped ? 'ghost' : 'secondary'}
              disabled={!!busyKey}
              onPress={() => void equip(t.equipped ? null : t.key)}
            />
          )}
        </View>
      ))}
      {error && <ErrorNote>{error}</ErrorNote>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  lead: { lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  tile: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  sub: { lineHeight: 20 },
});
