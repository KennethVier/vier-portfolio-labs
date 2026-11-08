// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { BusinessDialog } from './BusinessDialog.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

it('tracks visible viewport height and offset and cleans up keyboard viewport listeners', async () => {
  const viewport = new EventTarget()
  viewport.height = 800
  viewport.offsetTop = 0
  const remove = vi.spyOn(viewport, 'removeEventListener')
  vi.stubGlobal('visualViewport', viewport)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<BusinessDialog title="Product" onClose={() => {}}>Sale options</BusinessDialog>))
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog.style.getPropertyValue('--business-viewport-height')).toBe('800px')
    viewport.height = 360
    viewport.offsetTop = 120
    await act(async () => viewport.dispatchEvent(new Event('resize')))
    expect(dialog.style.getPropertyValue('--business-viewport-height')).toBe('360px')
    expect(dialog.style.getPropertyValue('--business-viewport-top')).toBe('120px')
    viewport.offsetTop = 80
    await act(async () => viewport.dispatchEvent(new Event('scroll')))
    expect(dialog.style.getPropertyValue('--business-viewport-top')).toBe('80px')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
  expect(remove.mock.calls.map(([event]) => event)).toEqual(['resize', 'scroll'])
})
