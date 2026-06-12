import { useState, useEffect } from 'react'
import {
  ExternalLink, TrendingUp, BarChart2, Megaphone,
  DollarSign, MousePointer2, ShoppingCart, Percent,
  User, AlertCircle, RefreshCw,
} from 'lucide-react'
import { loadMetricas } from '../../lib/api'

const EXTERNAL_DASHBOARD_URL = 'https://api.marazulagenciadigital.com.br'

const CORES = ['cyan', 'violet', 'green', 'amber']
const METRIC_ICONS = [DollarSign, MousePointer2, ShoppingCart, TrendingUp, Percent]
const METRIC_COLORS = ['cyan', 'violet', 'green', 'amber', 'cyan']
const fmtBRL  = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNum  = v => Number(v).toLocaleString('pt-BR')
const fmtData = d => new Date(d + 'T00:00').toLocaleDateString('pt-BR')

function useMetricas() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  async function load() {
    setLoading(true); setError(null)
    try { setRows(await loadMetricas()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return { rows, loading, error, retry: load }
}

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

export default function TrafegoPago() {
  const { rows, loading, error, retry } = useMetricas()
  const [activeClientId, setActiveClientId] = useState(null)

  const clients = [...new Set(rows.map(r => r.cliente).filter(Boolean))]
    .map((name, i) => ({ id: name, name, color: CORES[i % CORES.length] }))

  useEffect(() => {
    if (clients.length > 0 && !activeClientId) setActiveClientId(clients[0].id)
  }, [clients])

  const activeClient = clients.find(c => c.id === activeClientId)
  const dados = rows.filter(r => r.cliente === activeClientId)
  const tot = k => dados.reduce((s, r) => s + Number(r[k] ?? 0), 0)
  const investimento = tot('investimento'), sessoes = tot('sessoes'), conversoes = tot('conversoes')

  const metrics = [
    { label: 'Investimento',      value: fmtBRL(investimento), sub: 'Total no período' },
    { label: 'Sessões',           value: fmtNum(sessoes), sub: 'Visitas registradas' },
    { label: 'Conversões',        value: fmtNum(conversoes), sub: 'Ações concluídas' },
    { label: 'Custo/Conversão',   value: conversoes ? fmtBRL(investimento / conversoes) : '—', sub: 'Investimento ÷ conversões' },
    { label: 'Taxa de Conversão', value: sessoes ? (conversoes / sessoes * 100).toFixed(1) + '%' : '—', sub: 'Conversões ÷ sessões' },
  ]

  return (
    <div className="tp-portal">

      {/* ── Hero portal card ───────────────────────────────── */}
      <div className="tp-portal__hero">
        <div className="tp-portal__blob tp-portal__blob--cyan" />
        <div className="tp-portal__blob tp-portal__blob--violet" />
        <div className="tp-portal__grid-texture" />
        <div className="tp-portal__body">
          <div className="tp-portal__icon-ring">
            <div className="tp-portal__icon-inner"><TrendingUp size={28} /></div>
          </div>
          <h2 className="tp-portal__title">Dashboard de Tráfego Pago</h2>
          <p className="tp-portal__desc">
            Acesse o painel completo do seu gestor de tráfego com métricas
            em tempo real de Meta Ads e Google Ads, análise de campanhas,
            ROAS e relatórios detalhados.
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

      {/* ── Relatório por Cliente ──────────────────────────── */}
      <div className="tp-report">
        <div className="tp-report__header">
          <div className="tp-report__header-left">
            <h3 className="tp-report__title">Relatório por Cliente</h3>
            <p className="tp-report__sub">Selecione o cliente para visualizar as métricas</p>
          </div>
        </div>

        {error && <ErrorBox message={error} onRetry={retry} />}
        {!loading && !error && clients.length === 0 && (
          <p className="tp-report__sub">Nenhum dado ainda — insira lançamentos na tabela métricas.</p>
        )}

        {!loading && !error && clients.length > 0 && (
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

        {activeClientId && dados.length > 0 && (
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
                    <p className="tp-report__metric-value">{m.value}</p>
                    <p className="tp-report__metric-sub">{m.sub}</p>
                  </div>
                )
              })}
            </div>

            <div className="dash-card tp-report__table-card">
              <div className="tp-report__table-header">
                <p className="dash-label">Lançamentos — {activeClient?.name}</p>
              </div>
              <table className="tp-table">
                <thead>
                  <tr><th>Data</th><th>Sessões</th><th>Conversões</th><th>Investimento</th></tr>
                </thead>
                <tbody>
                  {dados.map(r => (
                    <tr key={r.id}>
                      <td>{fmtData(r.data)}</td>
                      <td>{fmtNum(r.sessoes)}</td>
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