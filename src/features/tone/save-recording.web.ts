/** Bản web: tải tệp ghi âm (blob) về máy như liên kết "Tải bản ghi về máy" của web. */
export async function saveRecording(uri: string, name: string) {
  const a = document.createElement('a');
  a.href = uri;
  a.download = name;
  a.click();
  return true;
}
