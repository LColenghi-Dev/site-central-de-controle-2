import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, TrendingUp, Layers, Cpu, FileText,
  Bell, Settings, LogOut, ChevronRight, Menu,
} from 'lucide-react'
import logo from '../../assets/imagens/logo-marazul.svg'
// MUDANÇA 1: importa o loadPerfil do api.js
import { loadPerfil } from '../../lib/api'
import VisaoGeral            from './VisaoGeral'
import TrafegoPago           from './TrafegoPago'
import Projetos              from './Projetos'
import Automacoes            from './Automacoes'
import RelatoriosDemandas    from './RelatoriosDemandas'
import Configuracoes         from './Configuracoes'
import NotificacoesDrawer, { loadNotifs } from './NotificacoesDrawer'

const TABS = [
  { id: 'visao',      label: 'Visão Geral',     icon: LayoutDashboard },
  { id: 'trafego',    label: 'Tráfego Pago',     icon: TrendingUp      },
  { id: 'projetos',   label: 'Projetos',         icon: Layers          },
  { id: 'auto',       label: 'Automações',       icon: Cpu             },
  { id: 'relatorios', label: 'Rel. de Demandas', icon: FileText        },
]

const TAB_COMPONENTS = {
  visao:         VisaoGeral,
  trafego:       TrafegoPago,
  projetos:      Projetos,
  auto:          Automacoes,
  relatorios:    RelatoriosDemandas,
  configuracoes: Configuracoes,
}

/* Mês atual capitalizado em pt-BR */
const periodoAtual = new Date()
  .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  .replace(/^\w/, c => c.toUpperCase())

// MUDANÇA 2: a função não lê mais o storage — só transforma nome em iniciais.
function initialsFromNome(nome) {
  return nome.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [active,      setActive]      = useState('visao')
  const [navOpen,     setNavOpen]     = useState(false)
  const [showNotif,   setShowNotif]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(
    () => loadNotifs().filter(n => !n.read).length
  )

  // MUDANÇA 3: padrão de 3 linhas — avatar nasce com 'LF', carrega via api.
  // Dependência [active]: recarrega ao trocar de aba, então se o usuário
  // editar o perfil em Configurações, o avatar atualiza ao sair de lá.
  const [avatarInitials, setAvatarInitials] = useState('LF')

  useEffect(() => {
    loadPerfil().then(p => {
      setAvatarInitials(p?.nome ? initialsFromNome(p.nome) : 'LF')
    })
  }, [active])

  function logout() {
    signOut()
    navigate('/login')
  }

  function handleCloseNotif() {
    setShowNotif(false)
  }

  function navigate_to(id) {
    setActive(id)
    setNavOpen(false)
  }

  const CurrentTab  = TAB_COMPONENTS[active]
  const activeLabel = active === 'configuracoes'
    ? 'Configurações'
    : TABS.find(t => t.id === active)?.label

  return (
    <div className={`dash${navOpen ? ' dash--nav-open' : ''}`}>

      {/* Overlay para fechar nav no mobile */}
      {navOpen && (
        <div className="dash__nav-overlay" onClick={() => setNavOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="dash__sidebar">
        <div className="dash__sidebar-top">

          <div className="dash__brand">
            <img src={logo} alt="Marazul" className="dash__brand-logo" />
          </div>

          <nav className="dash__nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`dash__nav-item${active === id ? ' dash__nav-item--active' : ''}`}
                onClick={() => navigate_to(id)}
              >
                <Icon size={17} className="dash__nav-icon" />
                <span>{label}</span>
                {active === id && <ChevronRight size={13} className="dash__nav-arrow" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="dash__sidebar-foot">
          <button
            className={`dash__foot-btn${active === 'configuracoes' ? ' dash__foot-btn--active' : ''}`}
            onClick={() => navigate_to('configuracoes')}
          >
            <Settings size={15} />
            <span>Configurações</span>
          </button>
          <button className="dash__foot-btn dash__foot-btn--danger" onClick={logout}>
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────── */}
      <div className="dash__main">

        {/* Header */}
        <header className="dash__header">
          <div className="dash__header-left">
            <button
              className="dash__hamburger"
              aria-label="Abrir menu"
              onClick={() => setNavOpen(v => !v)}
            >
              <Menu size={18} />
            </button>
            <p className="dash__breadcrumb">
              Central de Comando <span>/</span> {activeLabel}
            </p>
            <div className="dash__period-badge">
              <span className="dash__period-dot" />
              {periodoAtual}
            </div>
          </div>

          <div className="dash__header-right">
            <button
              className={`dash__bell${showNotif ? ' dash__bell--active' : ''}`}
              aria-label="Notificações"
              onClick={() => setShowNotif(v => !v)}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="dash__bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <div className="dash__avatar" title="Perfil">{avatarInitials}</div>
          </div>
        </header>

        {/* Content */}
        <main className="dash__content">
          <CurrentTab key={active} />
        </main>
      </div>

      {/* Gaveta de notificações */}
      {showNotif && (
        <NotificacoesDrawer
          onClose={handleCloseNotif}
          onCountChange={setUnreadCount}
        />
      )}
    </div>
  )
}