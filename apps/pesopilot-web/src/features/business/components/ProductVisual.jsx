import { BusinessIcon } from './BusinessIcon.jsx'
import { CATEGORY_SURFACES } from '../constants/productPresentation.js'

export function ProductVisual({ family, photo, className = '' }) {
  const icon = family.category === 'Shawls' ? 'shawl' : family.category === 'Magic Pillows' ? 'pillow' :
    family.category.endsWith('Rub') ? 'rub' : family.category.endsWith('Roll') ? 'roll' : 'bottle'
  return <div className={`product-visual ${className}`} style={{ '--category-surface': CATEGORY_SURFACES[family.category] ?? '#EEF2F8' }}>
    {photo ? <img src={photo.dataUrl} alt={`${family.name} product photo`} decoding="async" /> : <>
      <span className="product-visual-emblem"><BusinessIcon name={icon} className="h-16 w-16" /></span>
      <span className="product-visual-caption">{family.category}</span>
    </>}
  </div>
}
