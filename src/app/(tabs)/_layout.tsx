import { Tabs } from 'expo-router/js-tabs';

import { BottomNav } from '@/components/app-shell/bottom-nav';
import { TopBar } from '@/components/app-shell/top-bar';
import { useTheme } from '@/hooks/use-theme';
import { IN_MORE } from '@/lib/nav';

/**
 * Khung app như web ở khổ điện thoại: thanh trên chung + thanh tab dưới đáy (4 tab + "Thêm").
 * Từ điển, Xếp hạng, Lớp học, Tiến độ, Tài khoản là tab ẩn (mở từ "Thêm") để vẫn giữ 2 thanh như web.
 * `backBehavior="history"`: nút quay lại của Android đi ngược đúng thứ tự đã mở, như trình duyệt.
 */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        header: () => <TopBar />,
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="study" />
      <Tabs.Screen name="thi-thu-hsk" />
      <Tabs.Screen name="luyen-tap" />
      {IN_MORE.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
