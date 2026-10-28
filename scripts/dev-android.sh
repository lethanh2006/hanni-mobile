#!/usr/bin/env bash
# Chạy development build Android; tự build lại khi cấu hình hoặc dependency đổi.
set -euo pipefail
cd "$(dirname "$0")/.."

AVD="${AVD:-Hanni}"
APP_ID="com.hanni.app"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
ADB="$SDK/platform-tools/adb"
STAMP="/data/local/tmp/$APP_ID-native-signature"
# Chừa CPU cho giao diện máy ảo và hệ điều hành trên máy 2 nhân/4 luồng.
METRO_WORKERS="${METRO_WORKERS:-2}"
export GRADLE_OPTS="${GRADLE_OPTS:-} -Dorg.gradle.workers.max=2"
mkdir -p .expo
EMULATOR_LOG="$PWD/.expo/android-emulator.log"

if [ ! -x "$ADB" ]; then
  echo "Không tìm thấy adb tại $ADB. Hãy đặt ANDROID_HOME tới Android SDK." >&2
  exit 1
fi
"$ADB" start-server >/dev/null 2>&1

# Luôn chọn đúng máy; adb không có -s sẽ lỗi khi cắm điện thoại cùng lúc với máy ảo.
if [ -z "${ANDROID_SERIAL:-}" ]; then
  while read -r serial state _; do
    [[ "$serial" == emulator-* && "$state" == device ]] || continue
    name=$("$ADB" -s "$serial" emu avd name 2>/dev/null | tr -d '\r' | head -n 1)
    if [ "$name" = "$AVD" ]; then export ANDROID_SERIAL="$serial"; break; fi
  done < <("$ADB" devices)
fi

if [ -z "${ANDROID_SERIAL:-}" ]; then
  if [ ! -x "$SDK/emulator/emulator" ] || ! "$SDK/emulator/emulator" -list-avds | grep -Fxq "$AVD"; then
    echo "Không tìm thấy máy ảo $AVD. Tạo AVD hoặc dùng ANDROID_SERIAL=<thiết bị> npm run dev." >&2
    exit 1
  fi
  if ! pgrep -f "qemu-system.*-avd $AVD([[:space:]]|$)" >/dev/null; then
    echo "Bật máy ảo $AVD..."
    (setsid nohup "$SDK/emulator/emulator" -avd "$AVD" -no-snapshot -no-boot-anim -feature -Vulkan >"$EMULATOR_LOG" 2>&1 &)
  fi
fi

echo "Đợi Android khởi động (tối đa 180 giây)..."
deadline=$((SECONDS + 180))
while :; do
  if [ -z "${ANDROID_SERIAL:-}" ]; then
    while read -r serial state _; do
      [[ "$serial" == emulator-* && "$state" == device ]] || continue
      name=$("$ADB" -s "$serial" emu avd name 2>/dev/null | tr -d '\r' | head -n 1)
      if [ "$name" = "$AVD" ]; then export ANDROID_SERIAL="$serial"; break; fi
    done < <("$ADB" devices)
  fi
  if [ -n "${ANDROID_SERIAL:-}" ] && [ "$("$ADB" -s "$ANDROID_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; then break; fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "Android chưa khởi động được. Xem log tại $EMULATOR_LOG; nếu ADB offline, tắt máy ảo rồi chạy lại để cold boot." >&2
    exit 1
  fi
  sleep 2
done

# Stamp nằm trên từng thiết bị: checkout mới hoặc native config mới đều cần build lại.
signature=$(sha256sum package.json package-lock.json app.json | sha256sum | cut -d ' ' -f 1)
installed_signature=$("$ADB" -s "$ANDROID_SERIAL" shell cat "$STAMP" 2>/dev/null | tr -d '\r' || true)
if [ "${1:-}" = "--rebuild" ] || [ "$signature" != "$installed_signature" ] || ! "$ADB" -s "$ANDROID_SERIAL" shell pm path "$APP_ID" 2>/dev/null | grep -q '^package:'; then
  echo "Build và cài native app để khớp thư viện/cấu hình hiện tại..."
  npx expo prebuild --platform android
  npx expo run:android --device "$ANDROID_SERIAL" --no-bundler
  printf '%s\n' "$signature" | "$ADB" -s "$ANDROID_SERIAL" shell "cat > $STAMP"
  (cd android && ./gradlew --stop >/dev/null)
fi

# Dùng USB/ADB localhost: không phụ thuộc Wi-Fi hoặc firewall LAN.
"$ADB" -s "$ANDROID_SERIAL" reverse tcp:8081 tcp:8081
# Nếu Metro của chính dự án đang chạy, mở app luôn thay vì tạo server thứ hai.
if command -v fuser >/dev/null && command -v curl >/dev/null; then
  for metro_pid in $(fuser -n tcp 8081 2>/dev/null || true); do
    if [ "$(readlink "/proc/$metro_pid/cwd" 2>/dev/null || true)" = "$PWD" ] && curl -fsS --max-time 2 http://127.0.0.1:8081/status | grep -q 'packager-status:running'; then
      echo "Metro của Hanni đã chạy. Mở app trên $ANDROID_SERIAL..."
      "$ADB" -s "$ANDROID_SERIAL" shell am start -a android.intent.action.VIEW -d 'exp+hanni-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' "$APP_ID"
      exit 0
    fi
  done
fi
npx expo start --dev-client --android --localhost --port 8081 --max-workers "$METRO_WORKERS"
