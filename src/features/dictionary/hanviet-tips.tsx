import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Chữ Hán chen trong câu chữ Việt. */
function Zh({ children }: { children: string }) {
  return <Text style={{ fontFamily: Fonts.hanzi }}>{children}</Text>;
}

/**
 * "Mẹo Hán Việt" (`HanVietTips` của web): mẹo riêng của người Việt — âm Hán Việt, dấu → thanh, bộ thủ; bấm ← → để
 * chuyển mẹo. Mẹo nào trỏ tới tính năng app chưa có thì trỏ sang chỗ gần nhất đang có.
 */
const TIPS: { title: string; body: React.ReactNode; href: Href; cta: string }[] = [
  {
    title: 'Dấu tiếng Việt đoán được thanh',
    body: (
      <>
        Âm Hán Việt không dấu → thanh 1 (đúng 96%) · huyền → thanh 2 (91%) · hỏi/ngã → thanh 3 (92%) · sắc/nặng → thanh 4
        (94%). Vd <Zh>学</Zh> học → xué (thanh 2).
      </>
    ),
    href: '/phien-am',
    cta: 'Xem bảng phiên âm',
  },
  {
    title: 'Bạn đã biết sẵn gần 1.000 từ',
    body: (
      <>
        Đọc theo âm Hán Việt là ra luôn nghĩa: <Zh>电话</Zh> điện thoại, <Zh>世界</Zh> thế giới, <Zh>机会</Zh> cơ hội.
      </>
    ),
    href: '/tu-dien/电话',
    cta: 'Xem từ 电话',
  },
  {
    title: 'Ghép nghĩa từng chữ',
    body: (
      <>
        <Zh>电脑</Zh> = <Zh>电</Zh> điện + <Zh>脑</Zh> não → “bộ não chạy bằng điện” = máy tính.
      </>
    ),
    href: '/tu-dien/电脑',
    cta: 'Xem từ 电脑',
  },
  {
    title: 'Bộ thủ gợi nghĩa',
    body: (
      <>
        Chữ có bộ <Zh>氵</Zh> (thủy) thường liên quan tới nước: <Zh>河</Zh> hà, <Zh>海</Zh> hải, <Zh>洗</Zh> tẩy.
      </>
    ),
    href: { pathname: '/tu-dien', params: { q: '洗', tab: 'han-tu' } },
    cta: 'Xem chữ 洗',
  },
  {
    title: 'Lượng từ đi theo danh từ',
    body: (
      <>
        <Zh>一本书</Zh> một quyển sách · <Zh>一只猫</Zh> một con mèo · <Zh>一台电脑</Zh> một cái máy tính.
      </>
    ),
    href: '/tu-dien/书',
    cta: 'Xem lượng từ của 书',
  },
  {
    title: 'Một chữ, hai cách đọc',
    body: (
      <>
        <Zh>长</Zh> cháng (dài) / zhǎng (lớn lên) · <Zh>还</Zh> hái (vẫn) / huán (trả lại). Âm Hán Việt cũng đổi theo:
        trường / trưởng.
      </>
    ),
    href: '/tu-dien/长',
    cta: 'Xem chữ 长',
  },
];

export function HanVietTips() {
  const theme = useTheme();
  const [i, setI] = useState(0);
  const tip = TIPS[i];
  const nav = (icon: 'back' | 'arrow', label: string, next: number) => (
    <Pressable
      onPress={() => setI(next)}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.nav, { borderColor: theme.border }, pressed && { backgroundColor: theme.surface2 }]}>
      <Icon name={icon} size={14} />
    </Pressable>
  );
  return (
    <View>
      <View style={styles.head}>
        <AppText weight="700" style={styles.flex}>
          {tip.title}
        </AppText>
        <AppText variant="caption" color="muted">
          {i + 1}/{TIPS.length}
        </AppText>
      </View>
      <AppText color="muted" style={styles.body}>
        {tip.body}
      </AppText>
      <View style={styles.foot}>
        <Pressable onPress={() => router.push(tip.href)} hitSlop={6}>
          <AppText variant="caption" weight="600" color="primary">
            {tip.cta} →
          </AppText>
        </Pressable>
        <View style={styles.navs}>
          {nav('back', 'Mẹo trước', (i - 1 + TIPS.length) % TIPS.length)}
          {nav('arrow', 'Mẹo tiếp', (i + 1) % TIPS.length)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  body: { marginTop: 8, minHeight: 72, lineHeight: 24 },
  foot: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navs: { flexDirection: 'row', gap: 6 },
  nav: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
