import { useState } from 'react'
import { EMOJIS, summarizeReactions } from '../api/shared.js'

export default function ReactionBar({ reactions, userId, onToggle }) {
  const [picking, setPicking] = useState(false)
  const summary = summarizeReactions(reactions, userId)

  const pick = (emoji) => {
    setPicking(false)
    onToggle(emoji)
  }

  return (
    <div className="reactions">
      {summary.map((r) => (
        <button key={r.emoji} type="button" className={'chip' + (r.mine ? ' chip-mine' : '')} onClick={() => onToggle(r.emoji)} aria-pressed={r.mine} title={r.mine ? 'Remove your reaction' : 'React'}>
          {r.emoji} {r.count}
        </button>
      ))}
      <div className="picker-wrap">
        <button type="button" className="chip" onClick={() => setPicking((v) => !v)} aria-expanded={picking} aria-label="Add reaction">
          ☺︎ +
        </button>
        {picking && (
          <div className="picker" role="menu">
            {EMOJIS.map((e) => (
              <button key={e} type="button" role="menuitem" onClick={() => pick(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
