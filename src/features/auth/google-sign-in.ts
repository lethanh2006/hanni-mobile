/**
 * Lấy `idToken` Google để gửi `POST /auth/google` như nút Google của web (server tự xác minh token, không cần secret).
 * App dùng OAuth client RIÊNG (khai trong `.env` của app, xem `.env.example`) — server phải nhận client ID này là
 * audience hợp lệ (xem `docs/google-login-backend.env.example`). Thư viện native chỉ nạp khi bấm: bản app cài từ
 * trước khi có thư viện vẫn chạy, chỉ báo cần cập nhật.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;

/** Chưa khai client ID thì ẩn nút Google, như web ẩn khi thiếu `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. */
export const googleSignInEnabled = WEB_CLIENT_ID.length > 0;

/** `null` = người dùng đóng bảng chọn tài khoản. */
export async function getGoogleIdToken(): Promise<string | null> {
  let lib: typeof import('@react-native-google-signin/google-signin');
  try {
    lib = await import('@react-native-google-signin/google-signin');
  } catch {
    throw new Error('Bản ứng dụng này chưa có đăng nhập Google — cập nhật ứng dụng rồi thử lại nhé.');
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = lib;
  try {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    // Chỉ cần token để đăng nhập Hanni — thoát phiên Google trên máy để lần sau vẫn được chọn tài khoản.
    await GoogleSignin.signOut().catch(() => null);
    if (!res.data.idToken) throw new Error('Đăng nhập Google thất bại');
    return res.data.idToken;
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) return null;
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        throw new Error('Máy chưa có Google Play Services nên chưa đăng nhập Google được.');
      // DEVELOPER_ERROR (10): gói com.hanni.app + SHA-1 của khoá ký chưa được khai trong Google Cloud.
      if (err.code === '10' || err.code === 'DEVELOPER_ERROR')
        throw new Error('Đăng nhập Google chưa được cấu hình cho ứng dụng này.');
    }
    throw err instanceof Error && err.message ? err : new Error('Đăng nhập Google thất bại');
  }
}
