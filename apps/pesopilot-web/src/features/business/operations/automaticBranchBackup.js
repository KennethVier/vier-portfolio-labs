import { snapshots } from '../repositories/businessSnapshots.js'
import { getManilaDate } from '../services/dailyAuditService.js'
import { exportBranchBackup } from './branchBackup.js'
export async function saveBranchDailyBackup(
  database,
  userId,
  now = new Date(),
  archive = snapshots,
) {
  const day = getManilaDate(now)
  if (
    now.getTime() < Date.parse(day + 'T07:00:00+08:00') ||
    (await archive.branchDaily.get([userId, day]))
  )
    return
  // Verifies Admin authorization on each snapshot, using actual authorized cached records.
  const content = await exportBranchBackup(database, userId)
  await archive.transaction('rw', archive.branchDaily, async () => {
    if (await archive.branchDaily.get([userId, day])) return
    await archive.branchDaily.add({ userId, day, content })
    const rows = await archive.branchDaily
      .where('userId')
      .equals(userId)
      .sortBy('day')
    await archive.branchDaily.bulkDelete(
      rows
        .slice(0, Math.max(0, rows.length - 7))
        .map((row) => [userId, row.day]),
    )
  })
}
