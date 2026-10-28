import { useRef } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppText, Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';

/** Cổng thanh toán trả người dùng về trang Tài khoản của web (`returnUrl`/`cancelUrl` server dựng: `/account?premium=<mã>`). */
const RETURN_PREFIX = `${WEB_ORIGIN}/account`;

/**
 * Trang thanh toán mở NGAY TRONG APP (trước đó mở trình duyệt ngoài: trả tiền xong thì trình duyệt hiện trang web Hanni
 * chưa đăng nhập, phải tự đóng mới về app). Cổng chuyển về `RETURN_PREFIX` (trả xong hoặc bấm Huỷ) → đóng tấm này, app tự
 * hỏi server trạng thái đơn. Đường dẫn mở app ngân hàng / ví (không phải http) giao cho hệ điều hành.
 */
export function CheckoutSheet({ url, onClose }: { url: string; onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const closed = useRef(false);

  function close() {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }

  function shouldStart(req: { url: string }) {
    if (req.url.startsWith(RETURN_PREFIX)) {
      close();
      return false;
    }
    if (!/^https?:/i.test(req.url)) {
      void Linking.openURL(req.url).catch(() => {});
      return false;
    }
    return true;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <View style={[styles.page, { backgroundColor: theme.surface, paddingTop: insets.top }]}>
        <View style={[styles.head, { borderColor: theme.border }]}>
          <Icon name="lock" size={16} color="good" />
          <AppText weight="700" style={styles.title}>
            Thanh toán an toàn
          </AppText>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng trang thanh toán" style={styles.close}>
            <Icon name="close" size={20} color="muted" />
          </Pressable>
        </View>
        <WebView<object>
          source={{ uri: url }}
          onShouldStartLoadWithRequest={shouldStart}
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}
          style={styles.web}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingHorizontal: 16, minHeight: 52 },
  title: { flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  web: { flex: 1 },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
