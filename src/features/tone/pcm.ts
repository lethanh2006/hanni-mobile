/** Chuyển PCM 16-bit từ micro thành số thực [-1, 1] để thuật toán chấm thanh điệu sử dụng. */
export function pcm16ToFloat32(data: ArrayBuffer): Float32Array {
  const input = new DataView(data);
  const samples = new Float32Array(Math.floor(input.byteLength / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = input.getInt16(i * 2, true) / 32768;
  return samples;
}
