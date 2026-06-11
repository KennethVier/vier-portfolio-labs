import { db } from '../dexie.js'

export function createCrudRepository(storeName) {
  const table = () => db.table(storeName)

  return {
    create(record) {
      return table().add(record)
    },
    update(id, changes) {
      return table().update(id, changes)
    },
    remove(id) {
      return table().delete(id)
    },
    findById(id) {
      return table().get(id)
    },
    findAll() {
      return table().toArray()
    },
  }
}
