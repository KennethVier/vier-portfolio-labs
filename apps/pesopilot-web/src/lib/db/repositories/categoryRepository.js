import { STORE_NAMES } from '../schema.js'
import { createCrudRepository } from './createCrudRepository.js'

const baseRepository = createCrudRepository(STORE_NAMES.categories)

export const categoryRepository = {
  ...baseRepository,
  findByType(type) {
    return baseRepository.findAll().then((categories) =>
      categories.filter((category) => category.type === type),
    )
  },
  findByName(name) {
    return baseRepository.findAll().then((categories) =>
      categories.find((category) => category.name === name),
    )
  },
}
