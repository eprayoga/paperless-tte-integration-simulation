/**
 * A QR-looking module matrix used as a placeholder in the editor and preview.
 * It is not a scannable QR code: Paperless renders the real one when signing.
 */

const SIZE = 25

function isFinder(row: number, col: number, top: number, left: number): boolean | null {
  const r = row - top
  const c = col - left
  if (r < 0 || r > 6 || c < 0 || c > 6) return null
  const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3))
  return ring !== 2
}

function createMatrix(): boolean[][] {
  let seed = 0x5eed
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => {
      const finder =
        isFinder(row, col, 0, 0) ??
        isFinder(row, col, 0, SIZE - 7) ??
        isFinder(row, col, SIZE - 7, 0)
      if (finder !== null) return finder
      // Quiet separator around finder patterns.
      if ((row < 8 && col < 8) || (row < 8 && col >= SIZE - 8) || (row >= SIZE - 8 && col < 8)) {
        return false
      }
      if (row === 6 || col === 6) return (row + col) % 2 === 0
      return random() > 0.52
    }),
  )
}

export const DUMMY_QR_MATRIX: readonly (readonly boolean[])[] = createMatrix()
export const DUMMY_QR_MODULES = SIZE
