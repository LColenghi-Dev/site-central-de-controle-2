import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, DollarSign, Eye,
  ArrowUpRight, ArrowDownRight,
  Layers, Cpu, CheckCheck, Clock,
} from 'lucide-react'

/* ── KPIs (mock — substituir quando houver API de ads) ──────── */
const KPIS = [
  {
    label: 'Investimento',
    value: 28400,
    format: v => 'R$ ' + (v / 1000).toFixed(1) + 'k',
    trend: 14.2,
    up: true,
    icon: DollarSign,
    color: 'cyan',
    delay: 0,
  },
  {
    label: 'ROAS',
    value: 420,
    format: v => (v / 100).toFixed(1) + '×',
    trend: 18,
    up: true,
    icon: TrendingUp,
    color: 'green',
    delay: 80,
  },
  {
    label: 'Impressões',
    value: 1247,
    format: v => (v / 1000).toFixed(2) + 'M',
    trend: 22.5,
    up: true,
    icon: Eye,
    color: 'violet',
    delay: 160,
  },
  {
    label: 'Leads Gerados',
    value: 847,
    format: v => Math.round(v).toString(),
    trend: 18.3,
    up: true,
    icon: Users,
    color: 'amber',
    delay: 240,
  },
]

const WEEK_DATA = [
  { day: 'Seg', h: 52 }, { day: 'Ter', h: 68 },
  { day: 'Qua', h: 45 }, { day: 'Qui', h: 80 },
  { day: 'Sex', h: 73 }, { day: 'Sáb', h: 91 },
  { day: 'Dom', h: 84 },
]

const PROJ_SUMMARY = { andamento: 8, revisao: 2, concluidos: 14 }

/* ── n8n ──────────────────────────────────────────────────── */
const N8N_API = '/api/n8n'

function timeAgo(iso) {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)  return `${s}s atrás`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function fmtCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

/* ── Componente KPI com contador animado ─────────────────── */
function KpiCard({ label, value, format, trend, up, icon: Icon, color, delay }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const dur = 1400
      const run = ts => {
        const p = Math.min((ts - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 4)
        setDisplayed(eased * value)
        if (p < 1) requestAnimationFrame(run)
      }
      requestAnimationFrame(run)
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div className={`vg-kpi vg-kpi--${color}`}>
      <div className="vg-kpi__top">
        <span className="vg-kpi__label">{label}</span>
        <div className="vg-kpi__icon-wrap">
          <Icon size={15} />
        </div>
      </div>
      <p className="vg-kpi__value">{format(displayed)}</p>
      <div className={`vg-kpi__trend ${up ? 'vg-trend--up' : 'vg-trend--down'}`}>
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}% vs mês anterior
      </div>
    </div>
  )
}

/* ── Componente Principal ────────────────────────────────── */
export default function VisaoGeral() {
  /* ── Estado n8n ──────────────────────────────────────── */
  const [autoData,    setAutoData]    = useState(null)   // { ativos, execucoesHoje, uptime, uptimeNum, ultimaExec }
  const [autoLoading, setAutoLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { 'Accept': 'application/json' }

        const [wfRes, exRes] = await Promise.all([
          fetch(`${N8N_API}/api/v1/workflows`, { headers }),
          fetch(`${N8N_API}/api/v1/executions?includeData=false&limit=200`, { headers }),
        ])

        if (!wfRes.ok) return

        const wfData  = await wfRes.json()
        const exData  = exRes.ok ? await exRes.json() : { data: [] }
        const executions = exData.data ?? []
        const workflows  = wfData.data ?? []

        /* Flows ativos */
        const ativos = workflows.filter(w => w.active).length

        /* Execuções iniciadas hoje */
        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0)
        const execucoesHoje = executions.filter(e => {
          const t = e.startedAt || e.stoppedAt
          return t && new Date(t) >= inicioDia
        }).length

        /* Uptime (taxa de sucesso) */
        const ok = executions.filter(e => e.status === 'success').length
        const uptimeNum = executions.length ? (ok / executions.length) * 100 : 0
        const uptime    = executions.length ? uptimeNum.toFixed(1) + '%' : '—'

        /* Última execução (timestamp mais recente) */
        const ultimaExec = executions
          .map(e => e.startedAt || e.stoppedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0] ?? null

        setAutoData({ ativos, execucoesHoje, uptime, uptimeNum, ultimaExec })
      } catch {
        /* falha silenciosa — widget mantém último estado */
      } finally {
        setAutoLoading(false)
      }
    }

    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="vg">

      {/* Saudação */}
      <div className="vg-greeting">
        <div>
          <p className="vg-greeting__eyebrow">Bom dia — Junho 2025</p>
          <h2 className="vg-greeting__title">
            Sua conta está em <em>alta performance</em>.
          </h2>
        </div>
        <div className="vg-greeting__badge">
          <span className="vg-greeting__dot" />
          Dados atualizados agora
        </div>
      </div>

      {/* KPIs */}
      <div className="vg-kpis">
        {KPIS.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      {/* Gráfico 7 dias + widgets */}
      <div className="vg-bottom">

        {/* Mini chart */}
        <div className="vg-chart-card dash-card">
          <div className="vg-chart-card__head">
            <div>
              <p className="dash-label">Performance — Últimos 7 dias</p>
              <p className="vg-chart-card__sub">Investimento diário vs retorno</p>
            </div>
            <div className="vg-chart-legend">
              <span className="vg-legend-dot vg-legend-dot--cyan" /> Invest.
              <span className="vg-legend-dot vg-legend-dot--green" /> Retorno
            </div>
          </div>
          <div className="vg-bars">
            {WEEK_DATA.map((d, i) => (
              <div key={i} className="vg-bar-group">
                <div className="vg-bar-pair">
                  <div
                    className="vg-bar vg-bar--invest"
                    style={{ '--h': `${d.h * 0.75}%`, '--i': i }}
                  />
                  <div
                    className="vg-bar vg-bar--retorno"
                    style={{ '--h': `${d.h}%`, '--i': i + 0.5 }}
                  />
                </div>
                <span className="vg-bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widgets coluna direita */}
        <div className="vg-widgets">

          {/* Projetos widget */}
          <div className="vg-widget dash-card">
            <div className="vg-widget__head">
              <Layers size={15} className="vg-widget__icon" />
              <span className="vg-widget__title">Projetos</span>
            </div>
            <div className="vg-widget__rows">
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--cyan" />
                <span className="vg-widget__row-label">Em andamento</span>
                <span className="vg-widget__row-val">{PROJ_SUMMARY.andamento}</span>
              </div>
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--amber" />
                <span className="vg-widget__row-label">Em revisão</span>
                <span className="vg-widget__row-val">{PROJ_SUMMARY.revisao}</span>
              </div>
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--green" />
                <span className="vg-widget__row-label">Concluídos</span>
                <span className="vg-widget__row-val">{PROJ_SUMMARY.concluidos}</span>
              </div>
            </div>
            <div className="vg-widget__progress-bar">
              <div
                className="vg-widget__progress-fill"
                style={{ '--w': `${(PROJ_SUMMARY.concluidos / (PROJ_SUMMARY.andamento + PROJ_SUMMARY.revisao + PROJ_SUMMARY.concluidos)) * 100}%` }}
              />
            </div>
            <p className="vg-widget__foot">
              <CheckCheck size={12} /> {PROJ_SUMMARY.concluidos} entregas no mês
            </p>
          </div>

          {/* Automações n8n widget — dados reais */}
          <div className="vg-widget dash-card">
            <div className="vg-widget__head">
              <Cpu size={15} className="vg-widget__icon" />
              <span className="vg-widget__title">Automações n8n</span>
            </div>
            <div className="vg-widget__rows">
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--green vg-status--pulse" />
                <span className="vg-widget__row-label">Flows ativos</span>
                <span className="vg-widget__row-val">
                  {autoLoading ? '…' : (autoData?.ativos ?? '—')}
                </span>
              </div>
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--cyan" />
                <span className="vg-widget__row-label">Execuções hoje</span>
                <span className="vg-widget__row-val">
                  {autoLoading ? '…' : (autoData ? fmtCount(autoData.execucoesHoje) : '—')}
                </span>
              </div>
              <div className="vg-widget__row">
                <span className="vg-status-dot vg-status--violet" />
                <span className="vg-widget__row-label">Uptime</span>
                <span className="vg-widget__row-val">
                  {autoLoading ? '…' : (autoData?.uptime ?? '—')}
                </span>
              </div>
            </div>
            <div className="vg-widget__progress-bar">
              <div
                className="vg-widget__progress-fill vg-widget__progress-fill--green"
                style={{ '--w': autoData ? `${autoData.uptimeNum}%` : '0%' }}
              />
            </div>
            <p className="vg-widget__foot">
              <Clock size={12} />
              {autoLoading
                ? 'Conectando…'
                : autoData?.ultimaExec
                  ? `Última exec. ${timeAgo(autoData.ultimaExec)}`
                  : 'Nenhuma execução encontrada'}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
