/** Chia danh sách thành từng cặp — lưới 2 cột của web: 2 ô cùng hàng cao bằng nhau, ô lẻ cuối vẫn rộng nửa hàng. */
export function pairs<T>(list: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return rows;
}
