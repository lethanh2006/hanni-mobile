import { router } from 'expo-router';

/** Quay lại màn trước; mở thẳng (không có màn trước) thì về Trang chủ. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
