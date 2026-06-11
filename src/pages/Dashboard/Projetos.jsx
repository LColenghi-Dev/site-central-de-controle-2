import { useState } from 'react'
import {
  ExternalLink, Palette, Video, Calendar, Layers,
  BarChart2, ChevronDown, TrendingUp, Handshake,
} from 'lucide-react'

const CLICKUP_WORKSPACE = 'https://app.clickup.com'
const CLICKUP_DESIGN    = 'https://app.clickup.com/9007154660/v/l/8cdwhf4-13093'
const CLICKUP_VIDEO     = 'https://app.clickup.com/9007154660/v/l/6-901316762308-1'
const CLICKUP_AGENDA    = 'https://app.clickup.com/9007154660/v/l/8cdwhf4-13173'

const LISTS = [
  { icon: Palette,  name: 'Design',          label: 'Abrir Lista de Design', desc: 'Aprovação de criativos, identidade visual e materiais gráficos da conta.', color: 'violet', url: CLICKUP_DESIGN  },
  { icon: Video,    name: 'Edição de Vídeo', label: 'Abrir Lista de Vídeo',  desc: 'Roteiros, gravações, edições e publicação de conteúdo em vídeo.',          color: 'amber',  url: CLICKUP_VIDEO  },
  { icon: Calendar, name: 'Agendamentos',    label: 'Abrir Calendário',      desc: 'Calendário editorial e publicações sincronizados com o calendário da conta.', color: 'green',  url: CLICKUP_AGENDA },
]

/* ── Equipes fixas com ícones e cores ─────────────────────── */
const EQUIPES_DEF = [
  { key: 'design',  label: 'Design',          Icon: Palette,    color: 'violet' },
  { key: 'video',   label: 'Edição de Vídeo', Icon: Video,      color: 'amber'  },
  { key: 'trafego', label: 'Tráfego',          Icon: TrendingUp, color: 'cyan'   },
  { key: 'crm',     label: 'CRM',              Icon: Handshake,  color: 'green'  },
]

/* ── Métricas demo por equipe ─────────────────────────────── */
const PROD_EQUIPES = {
  todos:   { concluidas: 54, andamento: 11, pendentes: 10 },
  design:  { concluidas: 18, andamento:  5, pendentes:  3 },
  video:   { concluidas: 12, andamento:  4, pendentes:  6 },
  trafego: { concluidas: 14, andamento:  2, pendentes:  1 },
  crm:     { concluidas: 10, andamento:  0, pendentes:  0 },
}

const PERSON_FACTORS = [0.40, 0.30, 0.18, 0.12]

function loadStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

function getMetrics(equipeKey, pessoaId, usuarios) {
  const base = PROD_EQUIPES[equipeKey] ?? PROD_EQUIPES.todos
  if (pessoaId === 'todos') return base
  const idx = usuarios.findIndex(u => u.id === pessoaId)
  if (idx === -1) return base
  const f = PERSON_FACTORS[idx % PERSON_FACTORS.length]
  return {
    concluidas: Math.max(1, Math.round(base.concluidas * f) + (idx % 3)),
    andamento:  Math.max(0, Math.round(base.andamento  * f)),
    pendentes:  Math.max(0, Math.round(base.pendentes  * f) - (idx % 2)),
  }
}

function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

/* ── Card de Produtividade ──────────────────────────────────── */
function CardProdutividade() {
  const [equipe,  setEquipe]  = useState('todos')
  const [pessoaId, setPessoaId] = useState('todos')

  /* Carrega dados do localStorage (atualiza a cada render para pegar mudanças em Configurações) */
  const equipes  = loadStorage('cfg_equipes',  { design: [], video: [], trafego: [], crm: [] })
  const usuarios = loadStorage('cfg_usuarios', [])

  /* Membros da equipe selecionada (ou todos se "todos") */
  const membrosEquipe = equipe === 'todos'
    ? usuarios
    : (equipes[equipe] ?? []).map(id => usuarios.find(u => u.id === id)).filter(Boolean)

  /* Reset pessoa se ela não pertence mais à equipe selecionada */
  const pessoaValida = membrosEquipe.some(u => u.id === pessoaId) ? pessoaId : 'todos'

  const data   = getMetrics(equipe, pessoaValida, usuarios)
  const total  = data.concluidas + data.andamento + data.pendentes
  const prodPct = pct(data.concluidas, total)

  return (
    <div className="prod-card dash-card">

      {/* Cabeçalho */}
      <div className="prod-card__head">
        <div className="prod-card__title-row">
          <div className="prod-card__icon"><BarChart2 size={16} /></div>
          <h3 className="prod-card__title">Produtividade</h3>
        </div>

        <div className="prod-filters">
          {/* Filtro por equipe */}
          <div className="prod-filter-tabs">
            <button
              className={`prod-filter-tab${equipe === 'todos' ? ' prod-filter-tab--active' : ''}`}
              onClick={() => { setEquipe('todos'); setPessoaId('todos') }}
            >
              Todos
            </button>
            {EQUIPES_DEF.map(e => (
              <button
                key={e.key}
                className={`prod-filter-tab${equipe === e.key ? ' prod-filter-tab--active' : ''}`}
                onClick={() => { setEquipe(e.key); setPessoaId('todos') }}
              >
                {e.label}
              </button>
            ))}
          </div>

          {/* Filtro por pessoa (membros da equipe selecionada) */}
          {membrosEquipe.length > 0 && (
            <div className="prod-select-wrap">
              <select
                className="prod-select"
                value={pessoaValida}
                onChange={e => setPessoaId(e.target.value)}
              >
                <option value="todos">Todas as pessoas</option>
                {membrosEquipe.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
              <ChevronDown size={12} className="prod-select-arrow" />
            </div>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="prod-card__body">

        {/* Gauge circular */}
        <div className="prod-gauge">
          <div className="prod-gauge__ring" style={{ '--prod-pct': `${prodPct}%` }}>
            <div className="prod-gauge__hole">
              <span className="prod-gauge__num">{prodPct}%</span>
              <span className="prod-gauge__sub">concluído</span>
            </div>
          </div>
        </div>

        {/* Métricas + barras */}
        <div className="prod-body__right">
          <div className="prod-metrics">
            {[
              { dot: 'green', label: 'Concluídas',   val: data.concluidas },
              { dot: 'amber', label: 'Em andamento', val: data.andamento  },
              { dot: 'red',   label: 'Pendentes',    val: data.pendentes  },
            ].map(({ dot, label, val }) => (
              <div className="prod-metric" key={label}>
                <div className="prod-metric__top">
                  <div className={`prod-metric__dot prod-metric__dot--${dot}`} />
                  <span className="prod-metric__label">{label}</span>
                </div>
                <span className="prod-metric__val">{val}</span>
              </div>
            ))}
          </div>

          <div className="prod-bars">
            {[
              { label: 'Concluídas', val: data.concluidas, cls: 'green' },
              { label: 'Andamento',  val: data.andamento,  cls: 'amber' },
              { label: 'Pendentes',  val: data.pendentes,  cls: 'red'   },
            ].map(({ label, val, cls }) => (
              <div className="prod-bar-row" key={label}>
                <span className="prod-bar-label">{label}</span>
                <div className="prod-bar">
                  <div
                    className={`prod-bar__fill prod-bar__fill--${cls}`}
                    style={{ width: `${pct(val, total)}%` }}
                  />
                </div>
                <span className="prod-bar-pct">{pct(val, total)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Página de Projetos ─────────────────────────────────────── */
export default function Projetos() {
  return (
    <div className="cc">

      <div className="cc-header">
        <div>
          <p className="cc-eyebrow">Gestão de Projetos</p>
          <h2 className="cc-title">Central ClickUp</h2>
        </div>
        <a href={CLICKUP_WORKSPACE} target="_blank" rel="noopener noreferrer" className="cc-launch-btn cc-launch-btn--cyan">
          Abrir Workspace <ExternalLink size={14} />
        </a>
      </div>

      <div className="cc-workspace-hero dash-card">
        <div className="cc-workspace-hero__inner">
          <div className="cc-workspace-icon"><Layers size={22} /></div>
          <div>
            <p className="cc-workspace-hero__name">ClickUp — Marazul</p>
            <p className="cc-workspace-hero__sub">3 listas ativas &nbsp;·&nbsp; Sincronizado agora</p>
          </div>
        </div>
        <div className="cc-workspace-hero__links">
          <a href={CLICKUP_WORKSPACE} target="_blank" rel="noopener noreferrer" className="cc-quick-link">
            Visão Geral <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <CardProdutividade />

      <div className="cc-lists-grid">
        {LISTS.map((list, i) => {
          const Icon = list.icon
          return (
            <div key={i} className={`cc-list-card cc-list-card--${list.color}`}>
              <div className="cc-list-card__head">
                <div className={`cc-list-card__icon cc-list-card__icon--${list.color}`}>
                  <Icon size={20} />
                </div>
                <span className="cc-connected">
                  <span className="cc-connected-dot" /> Conectado
                </span>
              </div>
              <p className="cc-list-card__name">{list.name}</p>
              <p className="cc-list-card__desc">{list.desc}</p>
              <a href={list.url} target="_blank" rel="noopener noreferrer" className={`cc-launch-btn cc-launch-btn--${list.color}`}>
                {list.label} <ExternalLink size={14} />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
