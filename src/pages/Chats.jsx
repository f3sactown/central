import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/index.js'
import ChatList, { NewChatForm } from '../components/ChatList.jsx'
import ChatRoom from '../components/ChatRoom.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import Icon from '../components/Icon.jsx'
import ScreenHeader from '../components/ScreenHeader.jsx'
import Sheet from '../components/Sheet.jsx'
import { useRegionFilter } from '../lib/regionFilter.js'

// Chats from all my regions (or the filtered one). On phones the list and
// an open chat take turns filling the screen; on wider screens they sit
// side by side.
export default function Chats() {
  const { chatId } = useParams()
  const [regionId] = useRegionFilter()
  const navigate = useNavigate()
  const [chats, setChats] = useState(null)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => api.listChats(regionId || undefined).then(setChats, setError), [regionId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className={'chats-screen' + (chatId ? ' has-chat' : '')}>
      <div className="chats-list-pane">
        <ScreenHeader title="Chats" filter>
          <button type="button" className="icon-button" onClick={() => setCreating(true)} aria-label="New chat">
            <Icon name="plus" />
          </button>
        </ScreenHeader>
        <ErrorNote error={error} />
        {chats && <ChatList chats={chats} showRegion={!regionId} />}
      </div>
      <div className="chat-pane">
        {chatId ? <ChatRoom key={chatId} chatId={chatId} onLeft={load} /> : <div className="chat-placeholder muted">Pick a chat, or tap + to start one.</div>}
      </div>
      {creating && (
        <Sheet title="New chat" onClose={() => setCreating(false)}>
          <NewChatForm
            defaultRegionId={regionId}
            onCreated={async (id) => {
              setCreating(false)
              await load()
              navigate(`/chats/${id}`)
            }}
          />
        </Sheet>
      )}
    </div>
  )
}
