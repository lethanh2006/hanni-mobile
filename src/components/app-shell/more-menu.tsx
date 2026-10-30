import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { AppText, Icon, TextLink, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useStudyStats } from '@/lib/hooks';
import { ACCOUNT_LINK, NAV_MAIN, NAV_MORE } from '@/lib/nav';
import type { PremiumStatus } from '@/lib/types';

import { Brand } from './top-bar';

/**
 * Ngăn "Thêm" (`<dialog class="mobile-drawer">` + `Sidebar` của web): trượt từ trái, rộng min(300px, 88%),
 * bo góc phải 24px. Logo · 5 mục học · vạch · Xếp hạng, Lớp học, Tiến độ · chân: thẻ Premium, Tài khoản/Đăng xuất
 * (khách: Đăng nhập, Tạo tài khoản miễn phí).
 */
export function MoreMenu({ open, onClose, current }: { open: boolean; onClose: () => void; current?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(300, width * 0.88);
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!open) return;
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [open, slide]);

  /** Trượt ra rồi mới đóng hẳn. */
  const close = () =>
    Animated.timing(slide, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
      () => onClose(),
    );

  const go = (href: Href) => {
    close();
    router.navigate(href);
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: slide }]}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} accessibilityLabel="Đóng menu" />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: theme.surface,
            paddingTop: insets.top,
            boxShadow: `18px 0 60px ${alpha(theme.text, 0.15)}`,
            transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] }) }],
          },
        ]}
        accessibilityViewIsModal>
        <Pressable
          onPress={close}
          accessibilityLabel="Đóng menu"
          style={[styles.close, { top: insets.top + 12, backgroundColor: theme.surface2 }]}>
          <Icon name="close" size={18} color="muted" />
        </Pressable>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={() => go('/')} style={styles.brand} accessibilityLabel="Hanni — trang chủ">
            <Brand />
          </Pressable>
          <View style={styles.group}>
            {NAV_MAIN.map((l) => (
              <NavItem key={l.name} icon={l.icon} label={l.label} active={current === l.name} onPress={() => go(l.href)} badgeFor={l.name} />
            ))}
          </View>
          <View style={[styles.divider, { backgroundColor: alpha(theme.border, 0.7) }]} />
          <View style={styles.group}>
            {NAV_MORE.map((l) => (
              <NavItem key={l.name} icon={l.icon} label={l.label} active={current === l.name} onPress={() => go(l.href)} />
            ))}
          </View>
          <Footer current={current} go={go} onClose={close} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/**
 * Trang pháp lý + ghi công nguồn dữ liệu (dải liên kết chân trang của web). Mở bản web trong trình duyệt của app —
 * nội dung là văn bản dài, giữ 1 bản ở web để không lệch. Nguồn dữ liệu CC BY-SA bắt buộc ghi công.
 */
const LEGAL_LINKS = [
  { label: 'Giới thiệu', path: '/gioi-thieu' },
  { label: 'Điều khoản', path: '/dieu-khoan' },
  { label: 'Chính sách bảo mật', path: '/chinh-sach-bao-mat' },
  { label: 'Nguồn dữ liệu', path: '/nguon-du-lieu' },
];

function Footer({ current, go, onClose }: { current?: string; go: (href: Href) => void; onClose: () => void }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <View style={styles.footer}>
      {user && <PremiumNavCard go={go} />}
      <View style={[styles.footerLinks, { borderColor: alpha(theme.border, 0.7) }]}>
        {user ? (
          <>
            <NavItem
              small
              icon={ACCOUNT_LINK.icon}
              label={ACCOUNT_LINK.label}
              active={current === ACCOUNT_LINK.name}
              onPress={() => go(ACCOUNT_LINK.href)}
            />
            <NavItem
              small
              icon="logout"
              label={busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
              active={false}
              danger
              onPress={async () => {
                setBusy(true);
                await logout();
                setBusy(false);
                onClose();
              }}
            />
          </>
        ) : (
          <>
            <NavItem small icon="user" label="Đăng nhập" active={false} onPress={() => go('/login')} />
            <NavItem small icon="plus" label="Tạo tài khoản miễn phí" active={false} onPress={() => go('/register')} />
          </>
        )}
      </View>
      <View style={styles.legal}>
        {LEGAL_LINKS.map((l) => (
          <TextLink
            key={l.path}
            title={l.label}
            color="muted"
            size="caption"
            onPress={() => void WebBrowser.openBrowserAsync(`${WEB_ORIGIN}${l.path}`)}
          />
        ))}
      </View>
    </View>
  );
}

/** Thẻ "Hanni Premium" ở chân menu (`PremiumNavCard` của web). App không bán Premium nên nút mở Tài khoản. */
function PremiumNavCard({ go }: { go: (href: Href) => void }) {
  const theme = useTheme();
  const { data } = useSWR<PremiumStatus>('/premium/status');
  if (!data) return null;
  if (data.active)
    return (
      <NavItem
        small
        icon="crown"
        label={data.lifetime ? 'Premium trọn đời' : 'Đang dùng Premium'}
        active={false}
        accent
        onPress={() => go('/account')}
      />
    );
  return (
    <View
      style={[
        styles.premium,
        {
          borderColor: alpha(theme.accent, 0.3),
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.accent, 0.15)}, ${theme.surface} 50%, ${alpha(theme.primary, 0.08)})`,
        },
      ]}>
      <View style={styles.premiumTitle}>
        <View style={[styles.crown, { backgroundColor: alpha(theme.accent, 0.15) }]}>
          <Icon name="crown" size={16} color="accent" />
        </View>
        <AppText weight="700">Hanni Premium</AppText>
      </View>
      <AppText variant="caption" color="muted" style={styles.premiumText}>
        Trợ lý AI không giới hạn, Hanni Coach nhận xét kết quả, quét ảnh 100 lượt/ngày.
      </AppText>
      <Pressable
        onPress={() => go('/account')}
        style={({ pressed }) => [
          styles.upgrade,
          {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            boxShadow: pressed ? undefined : `0 3px 0 ${mix(theme.primary, '#000000', 0.62)}`,
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}>
        <AppText variant="caption" weight="700" color="primaryText">
          Nâng cấp
        </AppText>
        <Icon name="arrow" size={13} color="primaryText" />
      </Pressable>
    </View>
  );
}

/** Mục menu `.nav-item` của web: đang mở = nền đỏ 12%, chữ đỏ đậm, vạch đỏ 3px bên trái. */
function NavItem({
  icon,
  label,
  active,
  onPress,
  small = false,
  danger = false,
  accent = false,
  badgeFor,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
  danger?: boolean;
  accent?: boolean;
  badgeFor?: string;
}) {
  const theme = useTheme();
  const due = useStudyStats().data?.dueNow ?? 0;
  const count = badgeFor === 'study' ? due : 0;
  const color = active ? 'primary' : accent ? 'accent' : 'muted';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.item,
        active && {
          backgroundColor: alpha(theme.primary, 0.12),
          boxShadow: `inset 3px 0 0 ${theme.primary}, 0 4px 12px -6px ${alpha(theme.primary, 0.35)}`,
        },
        !active && pressed && { backgroundColor: danger ? alpha(theme.danger, 0.08) : alpha(theme.surface2, 0.8) },
      ]}>
      <Icon name={icon} size={small ? 16 : 18} color={color} />
      <AppText
        variant={small ? 'caption' : 'small'}
        weight={active ? '600' : '500'}
        color={color}
        style={styles.itemLabel}>
        {label}
      </AppText>
      {count > 0 && (
        <View style={[styles.count, { backgroundColor: alpha(theme.primary, 0.12) }]}>
          <AppText variant="caption" weight="700" color="primary">
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  legal: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, paddingHorizontal: 12 },
  backdrop: { backgroundColor: 'rgba(16, 23, 37, 0.44)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexGrow: 1, padding: 16 },
  brand: { marginBottom: 24, paddingTop: 8, paddingHorizontal: 8 },
  group: { gap: 4 },
  divider: { height: 1, marginVertical: 16 },
  footer: { marginTop: 'auto', paddingTop: 24 },
  footerLinks: { gap: 2, borderTopWidth: 1, paddingTop: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemLabel: { flex: 1 },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  premium: { marginBottom: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  premiumTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  crown: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  premiumText: { marginTop: 8, lineHeight: 19 },
  upgrade: {
    marginTop: 12,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
