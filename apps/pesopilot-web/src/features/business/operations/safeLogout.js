export async function safeBusinessLogout(database) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    throw new Error(
      'Reconnect and synchronize before signing out. Branch records remain on this device.',
    )
  // Supported provider path. Never use force: true or accept discarding queued writes.
  await database.cloud.sync({ purpose: 'push', wait: true })
  await database.cloud.logout()
}
