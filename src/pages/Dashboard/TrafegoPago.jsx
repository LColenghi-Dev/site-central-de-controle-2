import { useState, useEffect } from 'react'
import {
  ExternalLink, TrendingUp, BarChart2, Megaphone,
  DollarSign, MousePointer2, ShoppingCart, Percent,
  Link2, User, AlertCircle, RefreshCw,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   CONFIGURAÇÃO — troque pela URL base do dashboard do gestor
   ───────────────────────────────────────────────────────────── */
const EXTERNAL_DASHBOARD_URL = 'https://api.marazulagenciadigital.com.br'

const apiFetch = async (path) => {
  return fetch(`/api/traffic${path}`)
}

/*
  CONTRATO DE API ESPERADO
  ────────────────────────
  O dashboard externo precisa expor dois endpoints:

  1. GET /api/clients
     Retorna a lista de clientes:
     [
       { id: "abc123", name: "Nome do Cliente", color: "cyan" },
       ...
     ]
     Cores válidas: "cyan" | "violet" | "green" | "amber"

  2. GET /api/clients/:id/report
     Retorna os dados do cliente:
     {
       metrics: [
         { label: "Investimento", value: "R$ 2.400", sub: "Total gasto no período" },
         { label: "Cliques",      value: "8.432",    sub: "Cliques em anúncios"    },
         { label: "Conversões",   value: "214",      sub: "Ações concluídas"       },
         { label: "ROAS",         value: "4.2x",     sub: "Retorno sobre invest."  },
         { label: "CPC Médio",    value: "R$ 0,85",  sub: "Custo por clique"       },
         { label: "CTR",          value: "2.8%",     sub: "Taxa de clique"         }
       ],
       campaigns: [
         {
           name:        "Nome da Campanha",
           platform:    "Meta" | "Google",
           budget:      "R$ 1.200",
           impressions: "42.000",
           clicks:      "8.432",
           conv:        "214",
           roas:        "4.2x",
           status:      "Ativo" | "Pausado"
         },
         ...
       ]
     }
*/

const METRIC_ICONS = [DollarSign, MousePointer2, ShoppingCart, TrendingUp, BarChart2, Percent]
const METRIC_COLORS = ['cyan', 'violet', 'green', 'amber', 'cyan', 'violet']

/* ── Hooks de dados ─────────────────────────────────────────── */

function useClients() {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/clients')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setClients(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { clients, loading, error, retry: load }
}

function useClientReport(clientId) {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function load(id) {
    if (!id) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await apiFetch(`/clients/${id}/report`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setReport(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(clientId) }, [clientId])
  return { report, loading, error, retry: () => load(clientId) }
}

/* ── Componentes auxiliares ─────────────────────────────────── */

function ErrorBox({ message, onRetry }) {
  return (
    <div className="tp-fetch-error">
      <AlertCircle size={18} className="tp-fetch-error__icon" />
      <div className="tp-fetch-error__body">
        <p className="tp-fetch-error__title">Não foi possível carregar os dados</p>
        <p className="tp-fetch-error__sub">{message}</p>
      </div>
      <button className="tp-fetch-error__retry" onClick={onRetry}>
        <RefreshCw size={13} /> Tentar novamente
      </button>
    </div>
  )
}

function ClientTabsSkeleton() {
  return (
    <div className="tp-client-selector">
      {[1,2,3].map(i => (
        <div key={i} className="tp-client-tab-skeleton" style={{ width: 110 + i * 12 }} />
      ))}
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="tp-report__metrics">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="tp-report__metric tp-report__metric--cyan">
          <div className="tp-report__metric-top">
            <div className="cc-skeleton cc-skeleton--dot" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <div className="cc-skeleton cc-skeleton--line" style={{ width: 80 }} />
          </div>
          <div className="cc-skeleton" style={{ width: 90, height: 26, borderRadius: 4, marginBottom: 8 }} />
          <div className="cc-skeleton cc-skeleton--sub" style={{ width: 120 }} />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="dash-card tp-report__table-card">
      <div className="tp-report__table-header">
        <div className="cc-skeleton cc-skeleton--line" style={{ width: 160, height: 12 }} />
      </div>
      <div className="cc-skeleton-list" style={{ marginTop: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cc-skeleton-row">
            <div className="cc-skeleton-body">
              <div className="cc-skeleton cc-skeleton--line" style={{ width: `${55 + i * 8}%` }} />
              <div className="cc-skeleton cc-skeleton--sub" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────── */

export default function TrafegoPago() {
  const { clients, loading: loadingClients, error: clientsError, retry: retryClients } = useClients()
  const [activeClientId, setActiveClientId] = useState(null)

  /* Seleciona o primeiro cliente assim que a lista carrega */
  useEffect(() => {
    if (clients.length > 0 && !activeClientId) {
      setActiveClientId(clients[0].id)
    }
  }, [clients])

  const activeClient = clients.find(c => c.id === activeClientId)
  const { report, loading: loadingReport, error: reportError, retry: retryReport } = useClientReport(activeClientId)

  return (
    <div className="tp-portal">

      {/* Eyebrow */}

      {/* ── Hero portal card ───────────────────────────────── */}
      <div className="tp-portal__hero">
        <div className="tp-portal__blob tp-portal__blob--cyan" />
        <div className="tp-portal__blob tp-portal__blob--violet" />
        <div className="tp-portal__grid-texture" />

        <div className="tp-portal__body">
          <div className="tp-portal__icon-ring">
            <div className="tp-portal__icon-inner">
              <TrendingUp size={28} />
            </div>
          </div>

          <h2 className="tp-portal__title">Dashboard de Tráfego Pago</h2>
          <p className="tp-portal__desc">
            Acesse o painel completo do seu gestor de tráfego com métricas
            em tempo real de Meta Ads e Google Ads, análise de campanhas,
            ROAS e relatórios detalhados.
          </p>

          <div className="tp-portal__platforms">
            <div className="tp-portal__platform tp-portal__platform--meta">
              <Megaphone size={14} />
              Meta Ads
            </div>
            <div className="tp-portal__platform-sep" />
            <div className="tp-portal__platform tp-portal__platform--google">
              <BarChart2 size={14} />
              Google Ads
            </div>
          </div>

          <a
            href={EXTERNAL_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tp-portal__cta"
          >
            Abrir Dashboard
            <ExternalLink size={16} />
          </a>

          <p className="tp-portal__hint">Abre em nova aba</p>
        </div>
      </div>

      {/* ── Seção de Relatórios por Cliente ────────────────── */}
      <div className="tp-report">

        {/* Cabeçalho */}
        <div className="tp-report__header">
          <div className="tp-report__header-left">
            <h3 className="tp-report__title">Relatório por Cliente</h3>
            <p className="tp-report__sub">
              Selecione o cliente para visualizar as métricas e campanhas
            </p>
          </div>
          <a
            href={EXTERNAL_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn-ghost"
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            Ver relatório completo
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Seletor de clientes */}
        {loadingClients && <ClientTabsSkeleton />}
        {clientsError   && <ErrorBox message={clientsError} onRetry={retryClients} />}

        {!loadingClients && !clientsError && clients.length > 0 && (
          <div className="tp-client-selector">
            {clients.map(c => (
              <button
                key={c.id}
                className={`tp-client-tab tp-client-tab--${c.color ?? 'cyan'}${activeClientId === c.id ? ' tp-client-tab--active' : ''}`}
                onClick={() => setActiveClientId(c.id)}
              >
                <span className="tp-client-tab__avatar">
                  <User size={11} />
                </span>
                {c.name}
                {activeClientId === c.id && <span className="tp-client-tab__dot" />}
              </button>
            ))}
          </div>
        )}

        {/* Painel do cliente selecionado */}
        {activeClientId && (
          <div className="tp-client-panel" key={activeClientId}>

            {loadingReport && (
              <>
                <MetricsSkeleton />
                <TableSkeleton />
              </>
            )}

            {reportError && <ErrorBox message={reportError} onRetry={retryReport} />}

            {!loadingReport && !reportError && report && (
              <>
                {/* KPI tiles */}
                <div className="tp-report__metrics">
                  {report.metrics.map((m, i) => {
                    const Icon  = METRIC_ICONS[i]  ?? TrendingUp
                    const color = METRIC_COLORS[i] ?? 'cyan'
                    return (
                      <div key={i} className={`tp-report__metric tp-report__metric--${color}`}>
                        <div className="tp-report__metric-top">
                          <div className="tp-report__metric-icon">
                            <Icon size={14} />
                          </div>
                          <span className="tp-report__metric-label">{m.label}</span>
                        </div>
                        <p className="tp-report__metric-value">{m.value}</p>
                        <p className="tp-report__metric-sub">{m.sub}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Tabela de campanhas */}
                <div className="dash-card tp-report__table-card">
                  <div className="tp-report__table-header">
                    <p className="dash-label">
                      Campanhas — {activeClient?.name}
                    </p>
                  </div>
                  <table className="tp-table">
                    <thead>
                      <tr>
                        <th>Campanha</th>
                        <th>Plataforma</th>
                        <th>Orçamento</th>
                        <th>Impressões</th>
                        <th>Cliques</th>
                        <th>Conversões</th>
                        <th>ROAS</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.campaigns.map((c, i) => (
                        <tr key={i}>
                          <td>{c.name}</td>
                          <td>
                            <span className={`tp-badge tp-badge--${c.platform?.toLowerCase() === 'meta' ? 'meta' : 'google'}`}>
                              {c.platform}
                            </span>
                          </td>
                          <td>{c.budget}</td>
                          <td>{c.impressions}</td>
                          <td>{c.clicks}</td>
                          <td>{c.conv}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.roas}</td>
                          <td>
                            <span className={`tp-status tp-status--${c.status?.toLowerCase() === 'ativo' ? 'ativo' : 'pausado'}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        )}
      </div>

    </div>
  )
}
