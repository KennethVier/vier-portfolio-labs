import Dexie from 'dexie'
import { expect, it } from 'vitest'
import { fixture, seed } from './branchTestFixture.js'
import { saveBranchDailyBackup } from './automaticBranchBackup.js'
it('keeps seven private authorized daily branch copies without changing Phase 0 archives or source records', async () => {
  const db = fixture('auto-branch-source-' + crypto.randomUUID()),
    archive = new Dexie('auto-branch-archive-' + crypto.randomUUID())
  archive.version(1).stores({ daily: 'day' })
  await archive.open()
  await archive.daily.put({
    day: '2026-01-01',
    content: 'Original Phase 0 backup',
  })
  archive.close()
  archive.version(2).stores({ branchDaily: '[userId+day],userId,day' })
  await archive.open()
  try {
    await seed(db)
    const source = JSON.stringify(await db.branchCatalog.toArray())
    await saveBranchDailyBackup(
      db,
      'owner',
      new Date('2026-11-01T06:00:00+08:00'),
      archive,
    )
    expect(await archive.branchDaily.count()).toBe(0)
    for (let day = 1; day <= 9; day++) {
      const now = new Date(
        '2026-11-' + String(day).padStart(2, '0') + 'T07:00:00+08:00',
      )
      await saveBranchDailyBackup(db, 'owner', now, archive)
      await saveBranchDailyBackup(db, 'owner', now, archive)
    }
    const rows = await archive.branchDaily
      .where('userId')
      .equals('owner')
      .sortBy('day')
    expect(rows).toHaveLength(7)
    expect(rows[0].day).toBe('2026-11-03')
    expect(JSON.parse(rows[0].content)).toMatchObject({
      app: 'PesoPilot Branch Operations',
      version: 1,
    })
    await expect(
      saveBranchDailyBackup(
        db,
        'employee',
        new Date('2026-11-10T07:00:00+08:00'),
        archive,
      ),
    ).rejects.toThrow(/Admin/)
    expect(await archive.daily.get('2026-01-01')).toEqual({
      day: '2026-01-01',
      content: 'Original Phase 0 backup',
    })
    expect(JSON.stringify(await db.branchCatalog.toArray())).toBe(source)
    expect(await db.branchTransactions.count()).toBe(0)
  } finally {
    await db.delete()
    await archive.delete()
  }
})
