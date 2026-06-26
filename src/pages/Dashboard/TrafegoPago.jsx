import { useState, useEffect, useMemo } from 'react'
import {
  ExternalLink, TrendingUp, BarChart2, Megaphone,
  DollarSign, MousePointer2, ShoppingCart, Percent, Eye,
  User, AlertCircle, RefreshCw, Calendar,
} from 'lucide-react'
import { loadTrafegoClients, loadTrafegoDaily } from '../../lib/api'

const EXTERNAL_DASHBOARD_URL = 'https://trafego.marazulagenciadigital.com.br'

const CORES = ['cyan', 'violet', 'green', 'amber']
const METRIC_ICONS = [DollarSign, Eye, MousePointer2, ShoppingCart, Percent]
const METRIC_COLORS = ['cyan', 'violet', 'green', 'amber', 'cyan']

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNum = v => Number(v || 0).toLocaleString('pt-BR')
const fmtData = d => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '-'

function currentMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const iso = d => d.toISOString().slice(0, 10)
  return { since: iso(first), until: iso(now) }
}

function useTrafegoClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setClients(await loadTrafegoClients())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  return { clients, loading, error, retry: load }
}

function useTrafegoDaily(activeClientId, range) {
  const [cache, setCache] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cacheKey = activeClientId ? `${activeClientId}:${range.since}:${range.until}` : ''

  async function load({ force = false } = {}) {
    if (!activeClientId || (!force && cache[cacheKey])) return
    setLoading(true)
    setError(null)
    try {
      const rows = await loadTrafegoDaily({ clientId: activeClientId, ...range })
      setCache(prev => ({ ...prev, [cacheKey]: rows }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeClientId, range.since, range.until])

  return {
    rows: cache[cacheKey] ?? [],
    loading,
    error,
    retry: () => load({ force: true }),
  }
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="tp-fetch-error">
      <AlertCircle size={18} className="tp-fetch-error__icon" />
      <div className="tp-fetch-error__body">
        <p className="tp-fetch-error__title">Nao foi possivel carregar os dados</p>
        <p className="tp-fetch-error__sub">{message}</p>
      </div>
      <button className="tp-fetch-error__retry" onClick={onRetry}>
        <RefreshCw size={13} /> Tentar novamente
      </button>
    </div>
  )
}

export default function TrafegoPago() {
  const initialRange = useMemo(() => currentMonthRange(), [])
  const [range, setRange] = useState(initialRange)
  const [draftRange, setDraftRange] = useState(initialRange)
  const { clients: apiClients, loading: loadingClients, error: clientsError, retry: retryClients } = useTrafegoClients()
  const [activeClientId, setActiveClientId] = useState(null)

  const clients = apiClients.map((client, i) => ({ ...client, color: CORES[i % CORES.length] }))

  useEffect(() => {
    if (clients.length > 0 && !activeClientId) setActiveClientId(clients[0].id)
  }, [clients, activeClientId])

  const { rows: dados, loading: loadingDaily, error: dailyError, retry: retryDaily } = useTrafegoDaily(activeClientId, range)
  const activeClient = clients.find(c => c.id === activeClientId)

  const tot = k => dados.reduce((s, r) => s + Number(r[k] ?? 0), 0)
  const investimento = tot('investimento')
  const impressoes = tot('impressoes')
  const cliques = tot('cliques')
  const conversoes = tot('conversoes')

  const metrics = [
    { label: 'Investimento', value: fmtBRL(investimento), sub: `${fmtData(range.since)} - ${fmtData(range.until)}` },
    { label: 'Impressoes', value: fmtNum(impressoes), sub: 'Alcance entregue' },
    { label: 'Cliques', value: fmtNum(cliques), sub: 'Interacoes registradas' },
    { label: 'Conversoes', value: fmtNum(conversoes), sub: 'Acoes concluidas' },
    { label: 'Custo/Conversao', value: conversoes ? fmtBRL(investimento / conversoes) : '-', sub: 'Investimento / conversoes' },
  ]

  const invalidRange = Boolean(draftRange.since && draftRange.until && draftRange.since > draftRange.until)
  const rangeChanged = draftRange.since !== range.since || draftRange.until !== range.until

  function applyDateFilter(e) {
    e.preventDefault()
    if (invalidRange || !draftRange.since || !draftRange.until) return
    setRange(draftRange)
  }

  function resetDateFilter() {
    setDraftRange(initialRange)
    setRange(initialRange)
  }

  return (
    <div className="tp-portal">
      <div className="tp-portal__hero">
        <div className="tp-portal__blob tp-portal__blob--cyan" />
        <div className="tp-portal__blob tp-portal__blob--violet" />
        <div className="tp-portal__grid-texture" />
        <div className="tp-portal__body">
          <div className="tp-portal__icon-ring">
            <div className="tp-portal__icon-inner"><TrendingUp size={28} /></div>
          </div>
          <h2 className="tp-portal__title">Dashboard de Trafego Pago</h2>
          <p className="tp-portal__desc">
            Acesse o painel completo do seu gestor de trafego com metricas
            em tempo real de Meta Ads e Google Ads, analise de campanhas,
            ROAS e relatorios detalhados.
          </p>
          <div className="tp-portal__platforms">
            <div className="tp-portal__platform tp-portal__platform--meta"><Megaphone size={14} />Meta Ads</div>
            <div className="tp-portal__platform-sep" />
            <div className="tp-portal__platform tp-portal__platform--google"><BarChart2 size={14} />Google Ads</div>
          </div>
          <a href={EXTERNAL_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="tp-portal__cta">
            Abrir Dashboard <ExternalLink size={16} />
          </a>
          <p className="tp-portal__hint">Abre em nova aba</p>
        </div>
      </div>

      <div className="tp-report">
        <div className="tp-report__header">
          <div className="tp-report__header-left">
            <span className="tp-report__source-badge">API Trafego v1</span>
            <h3 className="tp-report__title">Relatorio por Cliente</h3>
            <p className="tp-report__sub">
              Selecione o cliente para visualizar as metricas de {fmtData(range.since)} a {fmtData(range.until)}
            </p>
          </div>
          <form className="tp-date-filter" onSubmit={applyDateFilter}>
            <label className="tp-date-field">
              <span>De</span>
              <Calendar size={13} />
              <input
                type="date"
                value={draftRange.since}
                max={draftRange.until || undefined}
                onChange={e => setDraftRange(prev => ({ ...prev, since: e.target.value }))}
              />
            </label>
            <label className="tp-date-field">
              <span>Ate</span>
              <Calendar size={13} />
              <input
                type="date"
                value={draftRange.until}
                min={draftRange.since || undefined}
                onChange={e => setDraftRange(prev => ({ ...prev, until: e.target.value }))}
              />
            </label>
            <button className="tp-date-apply" type="submit" disabled={!rangeChanged || invalidRange}>
              <RefreshCw size={13} /> Atualizar
            </button>
            <button className="tp-date-reset" type="button" onClick={resetDateFilter}>
              Mes atual
            </button>
            {invalidRange && <p className="tp-date-error">Periodo invalido</p>}
          </form>
        </div>

        {clientsError && <ErrorBox message={clientsError} onRetry={retryClients} />}
        {!clientsError && dailyError && <ErrorBox message={dailyError} onRetry={retryDaily} />}

        {loadingClients && (
          <div className="tp-client-selector">
            {[0, 1, 2].map(i => <div key={i} className="tp-client-tab-skeleton" />)}
          </div>
        )}

        {!loadingClients && !clientsError && clients.length === 0 && (
          <p className="tp-report__sub">Nenhum cliente retornado pela API de trafego.</p>
        )}

        {!loadingClients && !clientsError && clients.length > 0 && (
          <div className="tp-client-selector">
            {clients.map(c => (
              <button
                key={c.id}
                className={`tp-client-tab tp-client-tab--${c.color}${activeClientId === c.id ? ' tp-client-tab--active' : ''}`}
                onClick={() => setActiveClientId(c.id)}
              >
                <span className="tp-client-tab__avatar"><User size={11} /></span>
                {c.name}
                {activeClientId === c.id && <span className="tp-client-tab__dot" />}
              </button>
            ))}
          </div>
        )}

        {activeClientId && !clientsError && (
          <div className="tp-client-panel" key={activeClientId}>
            <div className="tp-report__metrics">
              {metrics.map((m, i) => {
                const Icon = METRIC_ICONS[i] ?? TrendingUp
                return (
                  <div key={i} className={`tp-report__metric tp-report__metric--${METRIC_COLORS[i]}`}>
                    <div className="tp-report__metric-top">
                      <div className="tp-report__metric-icon"><Icon size={14} /></div>
                      <span className="tp-report__metric-label">{m.label}</span>
                    </div>
                    <p className="tp-report__metric-value">{loadingDaily ? '...' : m.value}</p>
                    <p className="tp-report__metric-sub">{m.sub}</p>
                  </div>
                )
              })}
            </div>

            <div className="dash-card tp-report__table-card">
              <div className="tp-report__table-header">
                <p className="dash-label">Metricas diarias - {activeClient?.name}</p>
                {loadingDaily && <span className="tp-report__table-hint">Carregando...</span>}
              </div>
              <table className="tp-table">
                <thead>
                  <tr><th>Data</th><th>Impressoes</th><th>Cliques</th><th>Conversoes</th><th>Investimento</th></tr>
                </thead>
                <tbody>
                  {!loadingDaily && dados.length === 0 && (
                    <tr className="tp-report__row-placeholder">
                      <td colSpan={5}>Nenhuma metrica diaria para este cliente no periodo.</td>
                    </tr>
                  )}
                  {dados.map(r => (
                    <tr key={r.id}>
                      <td>{fmtData(r.data)}</td>
                      <td>{fmtNum(r.impressoes)}</td>
                      <td>{fmtNum(r.cliques)}</td>
                      <td>{fmtNum(r.conversoes)}</td>
                      <td>{fmtBRL(r.investimento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
