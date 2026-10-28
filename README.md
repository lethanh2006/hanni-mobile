
## Chạy

```bash
npm install
npm run dev            # Android: mở máy ảo, tự build/cài khi native config đổi
npx expo start --dev-client # mở bản development build đã cài trên điện thoại
npm run lint
npm run typecheck
```

Trên máy này có lối tắt **Hanni Mobile** ở Desktop. Mở lối tắt hoặc chạy `npm run dev`: máy ảo Hanni sẽ khởi động riêng và app tự mở. Lần khởi động lạnh có thể mất khoảng một phút; giữ terminal Metro đang chạy khi phát triển. Nếu Android Studio vẫn hiện “Connecting to the Emulator”, đóng tab máy ảo cũ trong Studio và dùng cửa sổ Hanni riêng. Máy ảo được cấu hình 720×1560, 2 lõi, 2 GB RAM; dữ liệu Android được giữ lại.

Dùng development build cho app này. Sau khi thêm thư viện native hoặc thay đổi plugin, cần build lại; `npm run dev` tự phát hiện thay đổi trong `app.json`, `package.json`, `package-lock.json`. Có thể ép build bằng `npm run dev -- --rebuild`. Chọn máy ảo bằng `AVD=Ten_may npm run dev`, hoặc thiết bị bằng `ANDROID_SERIAL=<serial> npm run dev`.

Nếu gặp `Cannot find native module 'ExponentImagePicker'` hoặc lỗi thiếu native module khác, bản app trên máy đang cũ: chạy `npm run dev -- --rebuild`. Chỉ reload Metro sẽ không thêm module vào APK.

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
