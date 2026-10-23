import { EmptyState, PageHeader, Screen, type IconName } from '@/components/ui';

/** Chỗ giữ cho tab chưa chuyển xong từ web sang app. */
export function ComingSoon({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <Screen safeTop>
      <PageHeader icon={icon} title={title} description={description} />
      <EmptyState
        title="Đang chuyển sang app"
        description="Phần này đang được làm. Trong lúc chờ, bạn vẫn dùng được trên web Hanni."
      />
    </Screen>
  );
}
