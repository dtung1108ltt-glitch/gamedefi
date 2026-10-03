// Toán học lưới hex kiểu "pointy-top" (đỉnh nhọn hướng lên) dùng cho bàn cờ chiến thuật.
// Toạ độ đầu vào là offset coordinates (col, row) — hàng lẻ dịch phải nửa ô.

export interface Point {
  x: number;
  y: number;
}

export const HEX_SIZE = 34; // bán kính tâm -> đỉnh
export const HEX_PADDING = 44;

export function hexToPixel(col: number, row: number, size: number = HEX_SIZE): Point {
  const width = Math.sqrt(3) * size;
  const height = 2 * size;
  const vertDist = height * 0.75;

  const x = width * col + (row % 2 === 1 ? width / 2 : 0) + HEX_PADDING;
  const y = vertDist * row + HEX_PADDING;

  return { x, y };
}

export function hexPolygonPoints(cx: number, cy: number, size: number = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // pointy-top: đỉnh đầu tiên hướng lên trên
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = cx + size * Math.cos(angleRad);
    const py = cy + size * Math.sin(angleRad);
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return points.join(' ');
}

export function boardPixelSize(cols: number, rows: number, size: number = HEX_SIZE) {
  const width = Math.sqrt(3) * size;
  const height = 2 * size;
  const vertDist = height * 0.75;
  return {
    width: width * cols + width / 2 + HEX_PADDING * 2,
    height: vertDist * rows + height / 4 + HEX_PADDING * 2,
  };
}

export function hexDistance(a: { col: number; row: number }, b: { col: number; row: number }): number {
  // Chuyển offset -> cube coordinates để tính khoảng cách chuẩn giữa 2 ô hex
  const toCube = (col: number, row: number) => {
    const x = col - (row - (row & 1)) / 2;
    const z = row;
    const y = -x - z;
    return { x, y, z };
  };
  const ac = toCube(a.col, a.row);
  const bc = toCube(b.col, b.row);
  return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z));
}

/**
 * Tính toán độ cao mặt phẳng bề mặt ô hex theo địa hình (Surface Z offset).
 */
export function getHexSurfaceHeight(terrain?: string): number {
  switch (terrain) {
    case 'hill': return 10;    // Gò cao (+10px theo trục pháp tuyến mặt đất Z)
    case 'fort': return 4;     // Doanh trại / Công sự (+4px theo Z)
    case 'forest': return 2;   // Nền rừng (+2px)
    case 'mud': return -2;     // Bãi lầy (-2px)
    case 'river': return -4;   // Mặt nước sông (-4px)
    case 'stakes': return -4;  // Đáy sông cắm cọc (-4px)
    default: return 0;         // Đồng bằng cơ bản (0px)
  }
}

/**
 * Trả về toạ độ bề mặt hoàn chỉnh của ô hex (x, y, surfaceZ).
 * Dùng làm gốc neo trực tiếp cho chân nhân vật, cây cối, cọc ngầm, căn cứ.
 */
export function getHexSurfacePosition(col: number, row: number, terrain?: string, size: number = HEX_SIZE) {
  const { x, y } = hexToPixel(col, row, size);
  const surfaceZ = getHexSurfaceHeight(terrain);
  return { x, y, surfaceZ };
}
