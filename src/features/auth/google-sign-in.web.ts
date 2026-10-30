/** Bản web của app (chỉ dùng khi dev): đăng nhập Google chỉ có trên điện thoại — trên web dùng web Hanni. */
export const googleSignInEnabled = false;

export async function getGoogleIdToken(): Promise<string | null> {
  throw new Error('Đăng nhập Google chỉ có trên ứng dụng điện thoại.');
}
