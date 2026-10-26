#!/usr/bin/env bash
# Chạy app trên máy ảo Android bằng 1 lệnh: `npm run dev`.
# - Máy ảo chưa bật thì tự bật (mặc định Hanni, đổi bằng `AVD=Ten_may npm run dev`) và đợi khởi động xong.
#   Tắt máy ảo bằng nút X trên cửa sổ của nó, đừng kill — tắt đột ngột dễ hỏng dữ liệu máy ảo.
# - Máy ảo chưa có bản dev của app thì build + cài (lâu, chỉ lần đầu).
# - Có rồi thì chỉ chạy Metro và mở app: sửa code, lưu file là app tự cập nhật.
# Thêm thư viện native hoặc sửa app.json (plugins, permissions, icon...) thì chạy `npm run dev -- --rebuild`.
set -euo pipefail
cd "$(dirname "$0")/.."

AVD="${AVD:-Hanni}"
APP_ID="com.hanni.app"
SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"
ADB="$SDK/platform-tools/adb"

"$ADB" start-server >/dev/null 2>&1
if ! "$ADB" devices | grep -q '^emulator-' && ! pgrep -f "qemu-system.*-avd $AVD" >/dev/null; then
  echo "Bật máy ảo $AVD..."
  # Chạy tách hẳn khỏi terminal: tắt Metro (Ctrl+C) hay đóng terminal thì máy ảo vẫn chạy.
  (setsid nohup "$SDK/emulator/emulator" -avd "$AVD" >/dev/null 2>&1 &)
fi

echo "Đợi máy ảo khởi động xong..."
until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done

if [ "${1:-}" = "--rebuild" ] || ! "$ADB" shell pm path "$APP_ID" 2>/dev/null | grep -q '^package:'; then
  echo "Build và cài bản dev lên máy ảo (lâu, chỉ cần làm 1 lần)..."
  npx expo prebuild --platform android
  npx expo run:android --no-bundler
  # Gradle chạy ngầm giữ vài GB RAM; máy không có swap thì dễ hết RAM làm sập máy ảo.
  (cd android && ./gradlew --stop >/dev/null)
fi

npx expo start --android
