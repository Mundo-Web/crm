import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Global from './Utils/Global.js'
import useWebSocket from './Reutilizables/CustomHooks/useWebSocket.jsx'

const Chatrucho = ({ session, messages: initialMessages = [], waDummy }) => {
  const dummyOptions = waDummy ? waDummy.split(',').map(n => n.trim()) : []
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [dummyNumber, setDummyNumber] = useState(dummyOptions[0] || '')

  const { socket } = useWebSocket({})

  const messagesEndRef = useRef(null)
  const sortedMessages = [...messages].sort((a, b) => a.microtime - b.microtime)

  const handleSend = async () => {
    if (!input.trim()) return
    try {
      await fetch(`${Global.APP_URL}/meta/evoapi/${session.business_uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            pushName: 'Dummy',
            key: {
              fromMe: false,
              remoteJid: `${dummyNumber}@s.whatsapp.net`
            },
            messageType: 'conversation',
            message: {
              conversation: input.trim()
            }
          }
        })
      })
      setInput('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handler = (data) => {
      setMessages((prevMessages) => [...prevMessages, data])
    }
    socket.on('message.created', handler)

    return () => {
      socket.off('message.created', handler)
    }
  }, [socket, dummyNumber])

  return (
    <div className="container d-flex justify-content-center align-items-center " style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="col-xl-4 col-lg-6 col-md-8 col-sm-10 col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Chat</h5>
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-light border-0 dropdown-toggle"
                type="button"
                id="numberDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {dummyNumber}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="numberDropdown">
                {dummyOptions.map((num) => (
                  <li key={num}>
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => setDummyNumber(num)}
                    >
                      {num}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card-body p-0 d-flex flex-column" style={{ height: '600px' }}>
            <div className="flex-fill overflow-auto p-3 bg-light">
              {sortedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`d-flex mb-2 ${msg.role === 'Human' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`px-3 py-2 rounded shadow-sm ${msg.role === 'Human'
                      ? 'bg-primary text-white'
                      : 'bg-white text-dark border'
                      }`}
                    style={{ maxWidth: '75%', whiteSpace: 'pre-line' }}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-group p-2 border-top">
              <textarea
                rows={3}
                className="form-control form-control-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Escribe un mensaje..."
              />
              <button className="btn btn-primary btn-sm" onClick={handleSend}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Simple Chat'>
      <Chatrucho {...properties} />
    </Adminto>
  )
})