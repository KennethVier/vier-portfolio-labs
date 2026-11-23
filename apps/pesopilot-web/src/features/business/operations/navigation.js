const admin = [
  ['/business', 'Overview', 'pos'],
  ['/business/sales', 'All Sales', 'history'],
  ['/business/analytics', 'Analytics', 'history'],
  ['/business/stock', 'Inventory Overview', 'inventory'],
  ['/business/audit', 'Daily Audits', 'audit'],
  ['/business/products', 'Products', 'inventory'],
  ['/business/branches', 'Branches and Users', 'settings'],
  ['/business/settings', 'Settings / Backup', 'settings'],
]
const staff = [
  ['/business', 'POS', 'pos'],
  ['/business/stock', 'Branch Inventory', 'inventory'],
  ['/business/sales', 'Branch Sales', 'history'],
  ['/business/audit', 'Daily Audit', 'audit'],
  ['/business/analytics', 'Branch Analytics', 'history'],
]
const legacyDevice = [
  ['/business', 'POS', 'pos'],
  ['/business/inventory', 'Inventory', 'inventory'],
  ['/business/audit', 'Daily Audit', 'audit'],
  ['/business/history', 'Sales Analytics', 'history'],
  ['/business/settings', 'Settings / Backup', 'settings'],
]
// Used only by retained standalone legacy components; the authenticated gate always supplies a role.
export const roleNavigation = (role) =>
  role === 'staff' ? staff : role === 'admin' ? admin : legacyDevice
export function permitsBusinessPath(profile, path) {
  if (!profile?.enabled || !['admin', 'staff'].includes(profile.role))
    return false
  if (profile.role === 'staff')
    return staff.some(([url]) => url === path) || path === '/business/receipts'
  return path !== '/business/pos'
}
