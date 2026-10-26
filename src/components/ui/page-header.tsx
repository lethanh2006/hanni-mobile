import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { alpha, mix, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

type Tone = 'primary' | 'good' | 'accent' | 'lavender';

/** Màu biểu tượng đầu trang: tông chính để trung tính (đỏ dành cho nút chính), tông khác giữ màu nhận diện. */
function useToneIcon(tone: Tone) {
  const theme = useTheme();
  return tone === 'primary'
    ? { color: alpha(theme.text, 0.78), bg: theme.surface2 }
    : { color: theme[tone as ThemeColor], bg: theme.surface };
}

/**
 * `PageHeading` của web ở khổ điện thoại: không khung — biểu tượng 40px + tiêu đề 22px + 1 câu mô tả (tối đa 2 dòng),
 * nút nhỏ (`right`) cùng hàng. Không có nhãn nhỏ phía trên (web ẩn trên điện thoại).
 */
export function PageHeader({
  icon,
  title,
  description,
  right,
  tone = 'primary',
}: {
  icon: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
  tone?: Tone;
}) {
  const theme = useTheme();
  const look = useToneIcon(tone);
  return (
    <View style={styles.page}>
      <View style={styles.identity}>
        <View
          style={[
            styles.pageIcon,
            { backgroundColor: look.bg, borderColor: theme.border, boxShadow: `0 2px 0 ${alpha(theme.text, 0.05)}` },
          ]}>
          <IconStroke name={icon} color={look.color} size={20} />
        </View>
        <View style={styles.copy}>
          <AppText variant="title">{title}</AppText>
          {description && (
            <AppText color="muted" numberOfLines={2} style={styles.description}>
              {description}
            </AppText>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}

/** `SectionHeading` của web: đầu mục có biểu tượng 40px, gạch chân mảnh. */
export function SectionHeading({
  icon,
  title,
  description,
  right,
  tone = 'primary',
}: {
  icon?: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
  tone?: Tone;
}) {
  const theme = useTheme();
  const look = useToneIcon(tone);
  return (
    <View style={[styles.section, { borderColor: mix(theme.border, theme.background, 0.75) }]}>
      <View style={styles.sectionIdentity}>
        {icon && (
          <View style={[styles.sectionIcon, { backgroundColor: look.bg, borderColor: theme.border }]}>
            <IconStroke name={icon} color={look.color} size={19} />
          </View>
        )}
        <View style={styles.copy}>
          <AppText variant="heading" style={styles.sectionTitle}>
            {title}
          </AppText>
          {description && (
            <AppText variant="small" color="muted" style={styles.sectionDescription}>
              {description}
            </AppText>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}

/** Đầu mục gọn bên trong thẻ (h2 `font-semibold` của web), nút/link nhỏ bên phải. */
export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <AppText variant="heading" style={styles.copy}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

/** Icon nhận màu tự do (không phải khoá màu của theme) — dùng cho các ô biểu tượng pha màu. */
function IconStroke({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <Icon name={name} size={size} rawColor={color} />;
}

const styles = StyleSheet.create({
  page: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  pageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  description: { marginTop: 4, fontSize: 13.5, lineHeight: 21 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  sectionIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, lineHeight: 24 },
  sectionDescription: { marginTop: 4, lineHeight: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
