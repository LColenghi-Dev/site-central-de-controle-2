import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, Zap, RefreshCw, AlertCircle } from 'lucide-react'

/* ──────────────────────────────────────────────────────────
   URL pública do n8n (abre no browser — link externo)
   Chamadas de API passam por /n8n-api/ (proxy Vite → sem CORS)
   ────────────────────────────────────────────────────────── */
const N8N_PUBLIC = 'https://n8n.marazulagenciadigital.com.br'
const N8N_API = '/api/n8n'

/* Formata tempo relativo em PT-BR */
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

/* Calcula taxa de sucesso (uptime %) de uma lista de execuções */
function calcUptime(executions) {
  if (!executions.length) return null
  const ok = executions.filter(e => e.status === 'success').length
  return ((ok / executions.length) * 100).toFixed(1) + '%'
}

/* ── Componente de linha esqueleto (loading) ─────────────── */
function SkeletonRow() {
  return (
    <div className="cc-skeleton-row">
      <div className="cc-skeleton cc-skeleton--dot" />
      <div className="cc-skeleton-body">
        <div className="cc-skeleton cc-skeleton--line" />
        <div className="cc-skeleton cc-skeleton--sub" />
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────── */
export default function Automacoes() {
  const [flows,    setFlows]    = useState([])
  const [uptime,   setUptime]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const headers = { 'Accept': 'application/json' }

      /* Busca workflows e execuções em paralelo */
      const [wfRes, exRes] = await Promise.all([
        fetch(`${N8N_API}/api/v1/workflows`, { headers }),
        fetch(`${N8N_API}/api/v1/executions?includeData=false&limit=200`, { headers }),
      ])

      if (!wfRes.ok) {
        const txt = await wfRes.text().catch(() => '')
        throw new Error(`n8n respondeu ${wfRes.status}${txt ? ': ' + txt.slice(0, 80) : ''}`)
      }

      const wfData = await wfRes.json()
      const exData = exRes.ok ? await exRes.json() : { data: [] }
      const executions = exData.data ?? []

      /* Última execução por workflowId */
      const lastExec = {}
      for (const ex of executions) {
        const t = ex.startedAt || ex.stoppedAt
        if (!lastExec[ex.workflowId] || t > lastExec[ex.workflowId]) {
          lastExec[ex.workflowId] = t
        }
      }

      /* Todos os workflows, ordenados: ativos primeiro */
      const all = (wfData.data ?? [])
        .map(w => ({
          id:     w.id,
          name:   w.name,
          active: w.active,
          last:   lastExec[w.id] ?? w.updatedAt ?? null,
          url:    `${N8N_PUBLIC}/workflow/${w.id}`,
        }))
        .sort((a, b) => Number(b.active) - Number(a.active))

      setFlows(all)
      setUptime(calcUptime(executions))
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  /* Carrega ao montar + auto-refresh a cada 60 s */
  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const activeCount   = flows.filter(f => f.active).length
  const inactiveCount = flows.filter(f => !f.active).length

  const heroSub = loading
    ? 'Conectando...'
    : error
      ? 'Erro ao conectar'
      : `${activeCount} publicado${activeCount !== 1 ? 's' : ''}${inactiveCount ? ` · ${inactiveCount} inativo${inactiveCount !== 1 ? 's' : ''}` : ''}${uptime ? ` · ${uptime} uptime` : ''}`

  return (
    <div className="cc">

      {/* Cabeçalho */}
      <div className="cc-header">
        <div>
          <p className="cc-eyebrow">Orquestração de Processos</p>
          <h2 className="cc-title">Automações n8n</h2>
        </div>
        <a
          href={N8N_PUBLIC}
          target="_blank"
          rel="noopener noreferrer"
          className="cc-launch-btn cc-launch-btn--orange"
        >
          Abrir Editor n8n <ExternalLink size={14} />
        </a>
      </div>

      <div className="cc-n8n-grid">

        {/* Hero card */}
        <div className="cc-n8n-hero dash-card">

          {/* Bloco informacional — agrupado no topo */}
          <div className="cc-n8n-hero__top">

            {/* Ícone + título + status */}
            <div className="cc-n8n-hero__inner">
              <div className="cc-n8n-logo">
                <Zap size={24} />
              </div>
              <div>
                <p className="cc-n8n-hero__name">n8n Workflow Editor</p>
                <div className="cc-n8n-hero__conn">
                  <span className="cc-n8n-conn-dot" />
                  {loading ? 'Conectando…' : error ? 'Erro de conexão' : 'Conectado'}
                </div>
              </div>
            </div>

            {/* Stats: publicados / inativos / uptime */}
            {!loading && !error && (
              <div className="cc-n8n-stats">
                <div className="cc-n8n-stat">
                  <p className="cc-n8n-stat__val cc-n8n-stat__val--green">{activeCount}</p>
                  <p className="cc-n8n-stat__label">Publicados</p>
                </div>
                <div className="cc-n8n-stat-sep" />
                <div className="cc-n8n-stat">
                  <p className="cc-n8n-stat__val cc-n8n-stat__val--red">{inactiveCount}</p>
                  <p className="cc-n8n-stat__label">Inativos</p>
                </div>
                <div className="cc-n8n-stat-sep" />
                <div className="cc-n8n-stat">
                  <p className="cc-n8n-stat__val">{uptime ?? '—'}</p>
                  <p className="cc-n8n-stat__label">Uptime</p>
                </div>
              </div>
            )}

            {/* Timestamp */}
            {updatedAt && !error && (
              <p className="cc-n8n-updated">
                Atualizado {timeAgo(updatedAt.toISOString())}
              </p>
            )}

          </div>{/* /cc-n8n-hero__top */}

          {/* Ações — fixadas no rodapé do card */}
          <div className="cc-n8n-hero__actions">
            <a
              href={N8N_PUBLIC}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-launch-btn cc-launch-btn--orange"
            >
              Abrir Workspace <ExternalLink size={14} />
            </a>
            <a
              href={`${N8N_PUBLIC}/workflow/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-btn-ghost"
            >
              Novo Flow <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Lista de flows */}
        <div className="cc-flows-list dash-card">

          {/* Cabeçalho da lista */}
          <div className="cc-flows-list__head">
            <p className="dash-label">Todos os Flows</p>
            <button
              className={`cc-refresh-btn${loading ? ' cc-refresh-btn--spin' : ''}`}
              onClick={load}
              disabled={loading}
              title="Recarregar agora"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Estado: carregando */}
          {loading && (
            <div className="cc-skeleton-list">
              {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* Estado: erro */}
          {!loading && error && (
            <div className="cc-error">
              <AlertCircle size={18} className="cc-error__icon" />
              <div className="cc-error__body">
                <p className="cc-error__title">Não foi possível conectar ao n8n</p>
                <p className="cc-error__sub">{error}</p>
                <p className="cc-error__hint">
                  Verifique se a <code>VITE_N8N_API_KEY</code> está configurada no <code>.env.local</code> e se o n8n está acessível.
                </p>
              </div>
              <button className="cc-error__retry" onClick={load}>
                <RefreshCw size={13} /> Tentar novamente
              </button>
            </div>
          )}

          {/* Estado: vazio */}
          {!loading && !error && flows.length === 0 && (
            <p className="cc-empty">Nenhum workflow encontrado.</p>
          )}

          {/* Estado: dados reais */}
          {!loading && !error && flows.map(f => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cc-flow-row"
            >
              <span className={`cc-flow-dot cc-flow-dot--${f.active ? 'active' : 'inactive'}`} />
              <div className="cc-flow-info">
                <p className={`cc-flow-name${f.active ? '' : ' cc-flow-name--off'}`}>{f.name}</p>
                <p className="cc-flow-last">
                  {f.active ? 'Publicado' : 'Não publicado'}
                  {f.last ? ` · última exec. ${timeAgo(f.last)}` : ''}
                </p>
              </div>
              <ExternalLink size={13} className="cc-flow-ext" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
