/** Tiny collision-free ID generator (no external dep) */
export function nanoid(size = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
