import { BUSINESS_REALM } from './branchRepository.js'
const accepted = (member) =>
  member.accepted && !member.rejected && member.roles?.join() === 'staff'
export function businessSetup(work) {
  const branches = work.branches
  const staff = work.members.filter(
    (member) => member.realmId === BUSINESS_REALM && accepted(member),
  )
  const assigned = branches.filter((branch) =>
    work.members.some(
      (member) =>
        member.realmId === branch.id &&
        accepted(member) &&
        staff.some(
          (person) =>
            (person.userId && person.userId === member.userId) ||
            (person.email &&
              person.email.toLowerCase() === member.email?.toLowerCase()),
        ),
    ),
  )
  const received = branches.filter((branch) =>
    (work.overviews ?? []).some(
      (view) =>
        view.branch.id === branch.id &&
        view.movements?.some((m) => m.delta > 0 && m.type !== 'sale'),
    ),
  )
  return [
    {
      label: 'Add products',
      done: work.catalog.some((product) => product.catalog?.type !== 'Set'),
      description:
        'Add names, scents and prices. Stock is received separately.',
      to: '/business/products',
      action: 'Set up products',
    },
    {
      label: 'Create a branch',
      done: branches.length > 0,
      description: branches.length
        ? `${branches.length} branch locations saved.`
        : 'Add the location where Staff will sell.',
      to: '/business/branches#add-branch',
      action: 'Create branch',
    },
    {
      label: 'Assign Staff',
      done: branches.length > 0 && assigned.length === branches.length,
      description: branches.length
        ? `${assigned.length} of ${branches.length} branches have Staff who accepted their invitation.`
        : 'Choose Staff for each branch, then ask them to accept their branch invitation.',
      to: '/business/branches#assign-staff',
      action: 'Assign Staff',
    },
    {
      label: 'Staff receives opening stock',
      done: branches.length > 0 && received.length === branches.length,
      description: branches.length
        ? `${received.length} of ${branches.length} branches have recorded physical stock. Staff receives units in Branch Inventory, then sells from POS.`
        : 'Staff records the units physically present in their branch.',
      to: '/business/stock',
      action: 'Review branch stock',
    },
  ]
}
