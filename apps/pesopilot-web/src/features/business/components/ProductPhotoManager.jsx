import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { ProductVisual } from './ProductVisual.jsx'
import { posCatalogService } from '../services/posCatalogService.js'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { validatePhotoFile } from '../services/productPhotoService.js'

function PhotoEditor({ family, photo, uploadPhoto, removePhoto, disabled }) {
  const action = useBusinessAction()
  const [preview, setPreview] = useState(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.dataUrl) }, [preview])
  return <article className="photo-editor">
    <ProductVisual family={family} photo={preview ?? photo} />
    <div className="min-w-0 flex-1">
      <h3 className="business-product-name">{family.name}</h3>
      <p className="mb-3 text-xs text-content-muted">{family.category}</p>
      <label className={`photo-picker ${disabled || action.saving ? 'opacity-60' : ''}`}>
        {action.saving ? 'Saving photo…' : photo ? 'Replace photo' : 'Add product photo'}
        <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`${photo ? 'Replace' : 'Add'} photo: ${family.name}`}
          disabled={disabled || action.saving} onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) action.run(async () => {
              validatePhotoFile(file)
              setPreview({ dataUrl: URL.createObjectURL(file) })
              try { await uploadPhoto(file, family.id) } finally { setPreview(null) }
            }, 'Photo saved on this device.')
          }} />
      </label>
      {photo ? <Button className="ml-2" variant="ghost" disabled={disabled || action.saving}
        onClick={() => action.run(() => removePhoto(family.id), 'Photo removed. Product and stock unchanged.')}>Remove photo</Button> : null}
      {action.error ? <p role="alert" className="mt-2 text-sm text-error">{action.error}</p> : null}
      {action.notice ? <p role="status" className="mt-2 text-sm text-secondary">{action.notice}</p> : null}
    </div>
  </article>
}

export function ProductPhotoManager({ products, photos, uploadPhoto, removePhoto, disabled }) {
  const families = posCatalogService.families(products)
  return <Card className="space-y-4 p-5">
    <div id="product-photos" className="scroll-mt-6"><h2 className="font-heading text-xl font-semibold">Product photos</h2>
      <p className="mt-2 text-sm text-content-muted">One optional photo per product card, shared across its options. JPEG, PNG or WebP, up to 2 MiB. Photos are resized locally, saved on this device, and included in Business backups. Up to 30 photos.</p></div>
    {families.length ? <div className="grid gap-3 lg:grid-cols-2">{families.map((family) => <PhotoEditor key={family.id} family={family} photo={photos.find((photo) => photo.familyId === family.id)} uploadPhoto={uploadPhoto} removePhoto={removePhoto} disabled={disabled} />)}</div> : <p className="text-sm text-content-muted">No products to photograph yet.</p>}
  </Card>
}
