
## Chạy

```bash
npm install
npm run dev            # Android: mở máy ảo, tự build/cài khi native config đổi
npx expo start --dev-client # mở bản development build đã cài trên điện thoại
npm run lint
npm run typecheck
```

Trên máy này có lối tắt **Hanni Mobile** ở Desktop. Mở lối tắt hoặc chạy `npm run dev`: máy ảo Hanni sẽ khởi động riêng và app tự mở. Lần khởi động lạnh có thể mất khoảng một phút; giữ terminal Metro đang chạy khi phát triển. Nếu Android Studio vẫn hiện “Connecting to the Emulator”, đóng tab máy ảo cũ trong Studio và dùng cửa sổ Hanni riêng. Máy ảo được cấu hình 720×1560, 2 lõi, 2 GB RAM; dữ liệu Android được giữ lại.

Dùng development build cho app này. Sau khi thêm thư viện native hoặc thay đổi plugin, cần build lại; `npm run dev` tự phát hiện thay đổi trong `app.json`, `app.config.js`, `package.json`, `package-lock.json`. Có thể ép build bằng `npm run dev -- --rebuild`. Chọn máy ảo bằng `AVD=Ten_may npm run dev`, hoặc thiết bị bằng `ANDROID_SERIAL=<serial> npm run dev`.

Máy ít RAM có thể đặt `METRO_WORKERS=1` khi chạy lệnh build; giới hạn này áp dụng cả cho bước đóng gói tài nguyên của Expo Updates.

## Cập nhật Android qua EAS Update

Sau mỗi lần push lên `master`, workflow `Cập nhật Android (EAS Update)` kiểm tra và phát hành thay đổi JavaScript, giao diện và tài nguyên lên kênh `production-apk`. GitHub Actions cần repository secret `EXPO_TOKEN` có quyền truy cập dự án Expo; các biến `EXPO_PUBLIC_*` dùng khi build bản cập nhật được quản lý trong EAS environment `production` và cần cập nhật tại đó khi thay đổi cấu hình.

APK 1.0.1 phát hành trên GitHub dùng kênh `production-apk` và runtime 1.0.1. Khi có mạng, app kiểm tra cập nhật lúc mở; bản tải về thường được áp dụng ở lần mở tiếp theo. Expo Go, development build, các kênh khác và bản iOS build riêng không nhận cập nhật từ workflow này.

OTA không thay đổi được thư viện hay cấu hình native. Workflow sẽ dừng nếu cấu hình hoặc dependency khác tag `v<phiên bản>`; hãy tăng phiên bản, build và phát hành APK mới, tạo tag đúng commit build, rồi chạy lại workflow. Đảm bảo tag trỏ đúng mã đã build, không tạo tag chỉ để vượt qua bước kiểm tra. Việc này không thay thế việc kiểm thử trên thiết bị.

Nếu gặp `Cannot find native module 'ExponentImagePicker'` hoặc lỗi thiếu native module khác, bản app trên máy đang cũ: chạy `npm run dev -- --rebuild`. Chỉ reload Metro sẽ không thêm module vào APK.

API mặc định là server production. Muốn trỏ nơi khác thì copy `.env.example` thành `.env.local`.

## Đăng nhập Google

App đã lấy Google ID token bằng native Google Sign-In và gửi `POST /api/auth/google`; server xác minh token rồi
đặt cookie phiên như web. Android dùng `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` trong `.env` (client loại **Web application**,
đuôi `h0qat6jqr0j309m1326blhmu7516g0rj`). Đây là `GOOGLE_GAME_CLIENT_ID_ANDROID` được dùng lại từ project Google của game;
không dùng `GOOGLE_GAME_CLIENT_ID` loại Desktop (đuôi `mtgqrosdib14ulgd185mkbcgk7gi4cpf`).

Để chạy trên thiết bị:

1. Server khai `GOOGLE_MOBILE_CLIENT_IDS` theo `docs/google-login-backend.env.example`, deploy code rồi restart.
   Giữ `GOOGLE_CLIENT_ID` hiện tại của web Hanni; request mobile không cần thêm `platform`.
2. Trong **cùng project Google**, tạo OAuth client loại Android cho package `com.hanni.app` + SHA-1 đúng khóa ký
   bản APK đang dùng (xem `.env.example`). Client Android của game không thay thế cấu hình package Hanni.
3. Kiểm tra `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` trong từng EAS environment đang build/update; giá trị cũ ở EAS có thể
   ghi đè `.env`. Bản app thiếu native Google Sign-In cần build APK mới, OTA không thêm được native module.
4. Thử đăng nhập trên máy: chọn tài khoản → vào Hanni; hủy chọn → giữ màn đăng nhập; mở lại app và thử đăng xuất.

iOS cần OAuth client loại iOS cho bundle `com.hanni.app`: khai `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` và thêm audience
tương ứng vào server. `app.config.js` tự đăng ký URL scheme đảo ngược client ID khi build; phải build lại iOS sau
khi đổi ID. Khi chưa có ID iOS thì app ẩn nút Google trên iPhone. Bản web chạy bằng Expo ẩn nút này; dùng website Hanni.

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
