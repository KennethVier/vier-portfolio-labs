// Stable, bounded prefix for local receipts. Legacy request keys remain valid.
export async function receiptPrefix(userId) {
  const bytes = new TextEncoder().encode(userId)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return 'actor/' + Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('') + '/'
}
