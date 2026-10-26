import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'

// A panel that slides up from the bottom on phones and shows as a dialog on
// larger screens. Closes on Escape or a tap outside.
export default function Sheet({ title, onClose, children }) {
  const panel = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('sheet-open')
    panel.current?.querySelector('textarea, input, select, button:not(.sheet-close)')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('sheet-open')
    }
  }, [onClose])

  // Rendered at the end of <body> so it sits above the tab bar and headers.
  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={panel}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button sheet-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
