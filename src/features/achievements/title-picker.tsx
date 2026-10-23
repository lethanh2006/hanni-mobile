import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ErrorNote, Icon, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { TitleShopCatalog } from '@/lib/types';

/**
 * Danh hiệu hiện cạnh tên trên hồ sơ và bảng xếp hạng. Mở theo huy hiệu đã đạt
 * (không mua bằng xu); chưa đạt thì ghi rõ cần đạt gì.
 */
export function TitlePicker() {
  const theme = useTheme();
  const { data, mutate } = useSWR<TitleShopCatalog>('/shop/titles');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;
  const owned = data.titles.filter((t) => t.owned).length;

  /** `key: null` = gỡ danh hiệu đang dùng. */
  async function equip(key: string | null) {
    setBusy(true);
    setError(null);
    try {
      await api.post('/shop/titles/equip', { titleKey: key });
      await mutate();
    } catch {
      setError('Chưa đổi được danh hiệu. Thử lại sau nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <AppText variant="heading">Danh hiệu</AppText>
      <AppText variant="small" color="muted">
        Đã mở {owned}/{data.titles.length} danh hiệu. Chọn 1 danh hiệu để hiện cạnh tên bạn trên hồ sơ và bảng xếp
        hạng.
      </AppText>
      {data.titles.map((t) => (
        <View
          key={t.key}
          style={[
            styles.row,
            { borderColor: t.equipped ? theme.primary : theme.border },
            t.equipped && { backgroundColor: theme.primarySoft },
          ]}>
          <Icon name={t.owned ? 'trophy' : 'lock'} size={18} color={t.owned ? 'accent' : 'muted'} />
          <View style={styles.flex}>
            <AppText variant="small" bold color={t.owned ? 'text' : 'muted'}>
              {t.label}
            </AppText>
            <AppText variant="caption" color="muted">
              {t.equipped ? 'Đang dùng' : t.owned ? 'Đã mở' : `Cần: ${t.requirement}`}
            </AppText>
          </View>
          {t.owned && !busy && (
            <TextLink
              title={t.equipped ? 'Bỏ' : 'Dùng'}
              color={t.equipped ? 'muted' : 'primary'}
              onPress={() => void equip(t.equipped ? null : t.key)}
            />
          )}
        </View>
      ))}
      {error && <ErrorNote>{error}</ErrorNote>}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flex: { flex: 1 },
});
