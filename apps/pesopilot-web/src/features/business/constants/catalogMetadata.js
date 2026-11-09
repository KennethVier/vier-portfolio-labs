import { z } from 'zod'

// Optional, unindexed product metadata: no store/index migration is needed.
export const catalogMetadataSchema = z.object({
  category: z.string().trim().min(1).max(80),
  family: z.string().trim().min(1).max(120),
  scent: z.string().trim().min(1).max(80).optional(),
  type: z.enum(['Solo', 'Set']).optional(),
  size: z.string().trim().min(1).max(80).optional(),
  sampleKey: z.string().regex(/^pos-demo-v1-[a-z0-9-]+$/).max(120).optional(),
}).strict()

export const PRODUCT_SCENTS = ['Eucalyptus', 'Lemon Grass', 'Turmeric', 'Lavender', 'Negative Ion']
export const CATALOG_CATEGORIES = ['Shawls', 'Hallelujah Inhaler', 'Hallelujah Rub', 'Hallelujah Roll', 'Reigna Aroma Rub', 'Reigna Aroma Roll', 'Magic Pillows']
