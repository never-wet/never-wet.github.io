export type GridCell<T> = T | null;

export const orthogonalDirections = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export const diagonalDirections = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

export const allDirections = [...orthogonalDirections, ...diagonalDirections] as const;

export function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

export function coordsToLabel(row: number, col: number, boardSize: number): string {
  const file = String.fromCharCode(97 + col);
  const rank = boardSize - row;
  return `${file}${rank}`;
}

export function boardHasEmptyCells<T>(grid: (T | null)[][]): boolean {
  return grid.some((row) => row.some((cell) => cell === null));
}
