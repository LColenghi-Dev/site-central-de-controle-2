import { useState } from 'react'
import { X, CheckCheck, Bell, FileText, Users, ShieldCheck, BellOff } from 'lucide-react'

const KEY_NOTIF = 'cfg_notificacoes'

const DEMO_NOTIFS = [
  {
    id: 'demo-n1',
    type: 'relatorio',
    title: 'Novo relatório criado',
    body: 'Relatório Semana 23 — Design & Criativos foi adicionado.',
    time: Date.now() - 2 * 3_600_000,
    read: false,
  },
  {
    id: 'demo-n2',
    type: 'equipe',
    title: 'Membro adicionado à equipe',
    body: 'Um novo membro foi atribuído à equipe de Design.',
    time: Date.now() - 6 * 3_600_000,
    read: false,
  },
  {
    id: 'demo-n3',
    type: 'sistema',
    title: 'API Key gerada',
    body: 'Uma nova chave de API foi gerada com sucesso.',
    time: Date.now() - 26 * 3_600_000,
    read: true,
  },
]

export function loadNotifs() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY_NOTIF) ?? 'null')
    return stored ?? DEMO_NOTIFS
  } catch { return DEMO_NOTIFS }
}

function saveNotifs(list) {
  localStorage.setItem(KEY_NOTIF, JSON.stringify(list))
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  const h   = Math.floor(diff / 3_600_000)
  const d   = Math.floor(diff / 86_400_000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  if (h < 24)   return `${h}h atrás`
  if (d === 1)  return 'ontem'
  return `${d}d atrás`
}

const TYPE_ICON = {
  relatorio: FileText,
  equipe:    Users,
  sistema:   ShieldCheck,
}

export default function NotificacoesDrawer({ onClose, onCountChange }) {
  const [notifs, setNotifs] = useState(loadNotifs)

  function update(next) {
    setNotifs(next)
    saveNotifs(next)
    onCountChange(next.filter(n => !n.read).length)
  }

  function markAllRead() {
    update(notifs.map(n => ({ ...n, read: true })))
  }

  function markRead(id) {
    update(notifs.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function dismiss(id, e) {
    e.stopPropagation()
    update(notifs.filter(n => n.id !== id))
  }

  function clearAll() {
    update([])
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />

      <div className="notif-drawer">
        {/* Cabeçalho */}
        <div className="notif-drawer__head">
          <div className="notif-drawer__head-left">
            <h3 className="notif-drawer__title">Notificações</h3>
            {unread > 0 && (
              <span className="notif-drawer__unread-badge">{unread} não lida{unread > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="notif-drawer__head-right">
            {unread > 0 && (
              <button className="notif-mark-btn" onClick={markAllRead} title="Marcar todas como lidas">
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="notif-list">
          {notifs.length === 0 ? (
            <div className="notif-empty">
              <BellOff size={30} className="notif-empty__icon" />
              <p className="notif-empty__text">Nenhuma notificação</p>
              <p className="notif-empty__sub">Você está em dia com tudo.</p>
            </div>
          ) : (
            notifs.map(n => {
              const Icon = TYPE_ICON[n.type] ?? Bell
              return (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`notif-item__icon notif-item__icon--${n.type}`}>
                    <Icon size={14} />
                  </div>
                  <div className="notif-item__body">
                    <p className="notif-item__title">{n.title}</p>
                    <p className="notif-item__desc">{n.body}</p>
                    <span className="notif-item__time">{timeAgo(n.time)}</span>
                  </div>
                  {!n.read && <div className="notif-item__dot" />}
                  <button
                    className="notif-item__dismiss"
                    onClick={(e) => dismiss(n.id, e)}
                    title="Dispensar"
                  >
                    <X size={11} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        {notifs.length > 0 && (
          <div className="notif-drawer__foot">
            <button className="notif-clear-btn" onClick={clearAll}>
              Limpar todas
            </button>
          </div>
        )}
      </div>
    </>
  )
}
