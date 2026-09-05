/**
 * Canvas needs colour as strings, not classes. Rather than hardcode a value in
 * a component, read the same custom properties the rest of the system uses.
 */
export type TokenName =
  | 'void-black'
  | 'pure-white'
  | 'charcoal'
  | 'graphite'
  | 'lamp-cream'
  | 'smoke'

const cache = new Map<TokenName, string>()

export function token(name: TokenName): string {
  const hit = cache.get(name)
  if (hit) return hit
  const value =
    typeof window === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
  if (value) cache.set(name, value)
  return value
}

/** `rgba()` over a token, for overlay work drawn at partial opacity. */
export function alpha(name: TokenName, a: number): string {
  const value = token(name)
  if (value.startsWith('#') && value.length === 7) {
    const r = parseInt(value.slice(1, 3), 16)
    const g = parseInt(value.slice(3, 5), 16)
    const b = parseInt(value.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return value
}
