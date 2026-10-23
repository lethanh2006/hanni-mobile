import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

/** 5 tab giống `NAV_MAIN` của web: Trang chủ · Ôn tập · Luyện thi · Luyện tập · Từ điển. */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <NativeTabs
      backgroundColor={theme.surface}
      tintColor={theme.primary}
      labelStyle={{ selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Trang chủ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Label>Ôn tập</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.stack" md="style" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="thi-thu-hsk">
        <NativeTabs.Trigger.Label>Luyện thi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="target" md="ads_click" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="luyen-tap">
        <NativeTabs.Trigger.Label>Luyện tập</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tu-dien">
        <NativeTabs.Trigger.Label>Từ điển</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
