# Hanni mobile

App Hanni (học tiếng Trung theo HSK 3.0) cho Android/iOS, chuyển từ web `hanni-client`.
Expo SDK 58 + expo-router, gọi cùng API với web (`hanni-server`).

## Chạy

```bash
npm install
npx expo start          # quét QR bằng Expo Go hoặc development build
npm run lint
npm run typecheck
```

API mặc định là server production. Muốn trỏ nơi khác thì copy `.env.example` thành `.env.local`.

## Cấu trúc

```
src/
├── app/                 màn hình (mỗi file là 1 route của expo-router)
│   ├── (tabs)/          5 tab: index (Trang chủ), study, thi-thu-hsk, luyen-tap, tu-dien
│   └── ...              màn mở từ tab (đăng nhập, bài học, tiến độ...)
├── features/<tên>/      code riêng của từng tính năng (component, hook)
├── components/ui/       bộ giao diện dùng chung: AppText, Button, Card, Screen, Icon...
├── constants/theme.ts   màu sáng/tối, khoảng cách, bo góc
├── hooks/               hook dùng chung (useTheme)
└── lib/                 api, auth, types, hook SWR dùng chung
```

## Quy ước

- Màu lấy qua `useTheme()`, không viết mã màu trong màn hình.
- Mọi request qua `api` trong `lib/api.ts`; dữ liệu đọc bằng `useSWR('/duong-dan')`.
- Hook chỉ một tính năng dùng thì để trong `src/features/<tính năng>/`, không thêm vào `lib/hooks.ts`.
- `lib/types.ts` chép nguyên từ web; chỉ thêm, không sửa kiểu đang có khi chưa báo người kia.
- Màn cần đăng nhập gọi `useRequireAuth()` ở đầu component.

## Chia việc

| Phần | Người làm |
|---|---|
| Nền móng (`lib/`, `components/ui/`, khung tab), đăng nhập, khảo sát, Trang chủ, bài học, Ôn tập, tiến độ, tài khoản, lớp học | lethanh2006 |
| Từ điển, Luyện thi HSK, Luyện tập (nghe, phát âm, viết, AI, video, trò chơi) | Huy Anh |

Sửa vào phần của người kia thì gửi PR để người đó duyệt.
