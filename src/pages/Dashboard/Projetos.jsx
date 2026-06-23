import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, BarChart2, Calendar, CheckCircle2, Clock3,
  ExternalLink, History, Layers, Palette, RefreshCw, Video, X,
} from 'lucide-react'
import { loadProdutividade } from '../../lib/api'

const CLICKUP_WORKSPACE = 'https://app.clickup.com'
const CLICKUP_DESIGN    = 'https://app.clickup.com/9007154660/v/l/8cdwhf4-13093'
const CLICKUP_VIDEO     = 'https://app.clickup.com/9007154660/v/l/6-901316762308-1'
const CLICKUP_AGENDA    = 'https://app.clickup.com/9007154660/v/l/8cdwhf4-13173'

const LISTS = [
  {
    icon: Palette,
    name: 'Design',
    label: 'Abrir Lista de Design',
    desc: 'Aprovação de criativos, identidade visual e materiais gráficos da conta.',
    color: 'violet',
    url: CLICKUP_DESIGN,
  },
  {
    icon: Video,
    name: 'Edição de Vídeo',
    label: 'Abrir Lista de Vídeo',
    desc: 'Roteiros, gravações, edições e publicação de conteúdo em vídeo.',
    color: 'amber',
    url: CLICKUP_VIDEO,
  },
  {
    icon: Calendar,
    name: 'Agendamentos',
    label: 'Abrir Calendário',
    desc: 'Calendário editorial e publicações sincronizados com o calendário da conta.',
    color: 'green',
    url: CLICKUP_AGENDA,
  },
]

const PEOPLE = [
  { key: 'patricia', nome: 'Patrícia', funcao: 'Design', color: 'violet' },
  { key: 'anna', nome: 'Anna', funcao: 'Edição de Vídeos', color: 'amber' },
  { key: 'bruno', nome: 'Bruno', funcao: 'Agendamentos', color: 'green' },
]

const METRIC_CONFIG = {
  patricia: [
    { key: 'paraFazer', label: 'Para Fazer', tone: 'cyan' },
    { key: 'emAprovacao', label: 'Em Aprovação', tone: 'amber' },
    { key: 'emAlteracao', label: 'Em Alteração', tone: 'red' },
  ],
  anna: [
    { key: 'paraFazer', label: 'Para Fazer', tone: 'cyan' },
    { key: 'emAndamento', label: 'Em Andamento', tone: 'violet' },
    { key: 'emAprovacao', label: 'Em Aprovação', tone: 'amber' },
    { key: 'emAlteracao', label: 'Em Alteração', tone: 'red' },
  ],
  bruno: [
    { key: 'paraAgendar', label: 'Para Agendar', tone: 'amber' },
    { key: 'postado', label: 'Postado · 30 dias', tone: 'green' },
  ],
}

const SOURCE_TEXT = {
  patricia: 'Para Fazer vem de Processo de Design & Criação. Aprovação e alteração vêm da pasta Clientes, filtradas pelo campo personalizado Designer = Patrícia.',
  anna: 'Para Fazer e Em Andamento vêm de Edição de Vídeos. Aprovação e alteração vêm da pasta Clientes, filtradas por Anna.',
  bruno: 'Em aberto considera Para Agendar. Postado considera apenas tarefas atualizadas nos últimos 30 dias na lista de Agendamentos.',
}

function CardProdutividade() {
  const [activePerson, setActivePerson] = useState('patricia')
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPayload(await loadProdutividade(30))
    } catch (err) {
      setError(err.message || 'Não foi possível consultar o ClickUp.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const person = payload?.pessoas?.[activePerson]
  const metrics = METRIC_CONFIG[activePerson]
  const deadline = person?.prazo

  const total = useMemo(
    () => metrics.reduce((sum, metric) => sum + Number(person?.metricas?.[metric.key] ?? 0), 0),
    [metrics, person],
  )

  const updatedAt = payload?.gerado_em
    ? new Date(payload.gerado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  function formatDate(value, includeTime = true) {
    if (!value) return 'Sem vencimento'
    return new Date(value).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime ? {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      } : {}),
    })
  }

  return (
    <section className="prod-card dash-card" aria-labelledby="produtividade-title">
      <div className="prod-card__head">
        <div className="prod-card__title-row">
          <div className="prod-card__icon"><BarChart2 size={16} /></div>
          <div>
            <h3 id="produtividade-title" className="prod-card__title">Produtividade da equipe</h3>
            <p className="prod-card__subtitle">
              Status operacionais do ClickUp
              {updatedAt && <> · atualizado às {updatedAt}</>}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="prod-refresh"
          onClick={refresh}
          disabled={loading}
          aria-label="Atualizar dados do ClickUp"
        >
          <RefreshCw size={14} className={loading ? 'prod-refresh__icon--spin' : ''} />
          {loading ? 'Atualizando' : 'Atualizar'}
        </button>
      </div>

      <div className="prod-person-tabs" role="tablist" aria-label="Profissionais">
        {PEOPLE.map(item => (
          <button
            type="button"
            role="tab"
            aria-selected={activePerson === item.key}
            key={item.key}
            className={`prod-person-tab prod-person-tab--${item.color}${activePerson === item.key ? ' prod-person-tab--active' : ''}`}
            onClick={() => setActivePerson(item.key)}
          >
            <span className="prod-person-tab__avatar">{item.nome.slice(0, 1)}</span>
            <span>
              <strong>{item.nome}</strong>
              <small>{item.funcao}</small>
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="prod-error" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>Não foi possível carregar os dados.</strong>
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <div className={`prod-live${loading ? ' prod-live--loading' : ''}`}>
          <div className="prod-live__summary">
            <span className="prod-live__eyebrow">{person?.funcao ?? PEOPLE.find(p => p.key === activePerson)?.funcao}</span>
            <strong className="prod-live__total">{loading ? '—' : total}</strong>
            <span className="prod-live__total-label">
              {activePerson === 'bruno' ? 'itens monitorados' : 'tarefas no fluxo'}
            </span>
          </div>

          <div className={`prod-live__metrics prod-live__metrics--${metrics.length}`}>
            {metrics.map(metric => (
              <article className={`prod-live-metric prod-live-metric--${metric.tone}`} key={metric.key}>
                <span className="prod-live-metric__label">{metric.label}</span>
                <strong>{loading ? '—' : Number(person?.metricas?.[metric.key] ?? 0)}</strong>
                <span className="prod-live-metric__bar" />
              </article>
            ))}
          </div>
        </div>
      )}

      {activePerson !== 'bruno' && !error && (
        <div className="prod-deadline">
          <div className="prod-deadline__score">
            <span className="prod-deadline__eyebrow">Entregas no prazo · 30 dias</span>
            <strong>{loading ? '—' : deadline?.percentualNoPrazo == null ? '—' : `${deadline.percentualNoPrazo}%`}</strong>
            <span>
              {deadline?.percentualNoPrazo == null
                ? 'Aguardando os primeiros eventos do webhook'
                : 'das tarefas com data de vencimento'}
            </span>
          </div>

          <div className="prod-deadline__counts">
            <div className="prod-deadline-count prod-deadline-count--green">
              <CheckCircle2 size={16} />
              <span>No prazo</span>
              <strong>{loading ? '—' : deadline?.noPrazo ?? 0}</strong>
            </div>
            <div className="prod-deadline-count prod-deadline-count--red">
              <Clock3 size={16} />
              <span>Atrasadas</span>
              <strong>{loading ? '—' : deadline?.atrasadas ?? 0}</strong>
            </div>
            <div className="prod-deadline-count">
              <AlertCircle size={16} />
              <span>Sem prazo</span>
              <strong>{loading ? '—' : deadline?.semPrazo ?? 0}</strong>
            </div>
          </div>

          <button
            type="button"
            className="prod-history-button"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={15} />
            Ver histórico
          </button>
        </div>
      )}

      <p className="prod-source-note">{SOURCE_TEXT[activePerson]}</p>

      {historyOpen && activePerson !== 'bruno' && (
        <div className="prod-history-overlay" onClick={() => setHistoryOpen(false)}>
          <aside
            className="prod-history"
            role="dialog"
            aria-modal="true"
            aria-label={`Histórico de entregas de ${person?.nome ?? ''}`}
            onClick={event => event.stopPropagation()}
          >
            <div className="prod-history__head">
              <div>
                <span>Últimos 30 dias</span>
                <h4>Histórico de {person?.nome}</h4>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Fechar histórico">
                <X size={17} />
              </button>
            </div>

            <div className="prod-history__list">
              {(deadline?.historico ?? []).length === 0 ? (
                <div className="prod-history__empty">
                  <History size={24} />
                  <strong>Nenhuma transição registrada ainda.</strong>
                  <span>O histórico começa após a ativação do webhook do ClickUp.</span>
                </div>
              ) : (
                deadline.historico.map((item, index) => (
                  <article className="prod-history-item" key={`${item.task_id}-${item.changed_at}-${index}`}>
                    <div className="prod-history-item__top">
                      {item.task_url ? (
                        <a href={item.task_url} target="_blank" rel="noopener noreferrer">
                          {item.task_name}
                        </a>
                      ) : <strong>{item.task_name}</strong>}
                      <span className={`prod-history-result prod-history-result--${item.deadline_result}`}>
                        {item.deadline_result === 'on_time'
                          ? 'No prazo'
                          : item.deadline_result === 'late' ? 'Atrasada' : 'Sem prazo'}
                      </span>
                    </div>
                    <div className="prod-history-item__transition">
                      {item.status_before} <span>→</span> {item.status_after}
                    </div>
                    <dl>
                      <div>
                        <dt>Mudança</dt>
                        <dd>{formatDate(item.changed_at)}</dd>
                      </div>
                      <div>
                        <dt>Alterado por</dt>
                        <dd>{item.changed_by_name || 'Não informado'}</dd>
                      </div>
                      <div>
                        <dt>Prazo</dt>
                        <dd>{formatDate(item.due_at, item.due_has_time !== false)}</dd>
                      </div>
                    </dl>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

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
            <p className="cc-workspace-hero__sub">3 listas ativas &nbsp;·&nbsp; Dados operacionais integrados</p>
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
        {LISTS.map(list => {
          const Icon = list.icon
          return (
            <div key={list.name} className={`cc-list-card cc-list-card--${list.color}`}>
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
