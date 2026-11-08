import { useEffect, useId, useRef } from 'react'
import { Modal } from '@/components/ui/Modal.jsx'

export function BusinessDialog({ title, children, onClose, canClose = true }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const viewport = window.visualViewport
    const element = ref.current
    function resize() {
      element?.style.setProperty('--business-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      element?.style.setProperty('--business-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('button')?.focus()
    return () => {
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', resize)
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  function handleKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (canClose) onClose()
    }
    if (event.key !== 'Tab') return
    const controls = [...ref.current.querySelectorAll('button, input, select, a[href], [tabindex="0"]')].filter((element) => !element.disabled)
    const first = controls[0]
    const last = controls.at(-1)
    if (!ref.current.contains(document.activeElement)) { event.preventDefault(); first?.focus() }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  return <div ref={ref} className="business-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={handleKey}>
    <Modal isOpen title={<span id={titleId}>{title}</span>} onClose={() => { if (canClose) onClose() }}>
      {children}
      {!canClose ? <p className="mt-3 text-sm text-content-muted">Keep this sale open until its result is confirmed. If this page closes, check Sales History before recording it again.</p> : null}
    </Modal>
  </div>
}
