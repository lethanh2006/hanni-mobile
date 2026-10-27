/** Bản web: tải tệp lịch (.ics) về máy như web Hanni. */
export async function saveIcs(body: string, name: string) {
  const href = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
