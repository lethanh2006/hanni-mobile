import { Asset } from 'expo-asset';

/** Bản web (chỉ để dev/debug): khai @font-face cho họ Geist với đủ độ đậm như trên điện thoại. */
const FILES: Record<number, number> = {
  400: require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
  500: require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
  600: require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
  700: require('@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf'),
  800: require('@expo-google-fonts/geist/800ExtraBold/Geist_800ExtraBold.ttf'),
};

let loaded = false;

export function loadWebFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const style = document.createElement('style');
  style.textContent = Object.entries(FILES)
    .map(
      ([weight, file]) =>
        `@font-face{font-family:Geist;font-weight:${weight};font-display:swap;src:url(${Asset.fromModule(file).uri}) format('truetype')}`,
    )
    .join('');
  document.head.appendChild(style);
}
