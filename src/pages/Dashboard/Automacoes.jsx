import { useEffect, useState, useCallback, useMemo } from 'react'
import { ExternalLink, Zap, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

/* ──────────────────────────────────────────────────────────
   URL pública do n8n (abre no browser — link externo)
   Chamadas de API passam por /n8n-api/ (proxy Vite → sem CORS)
   ────────────────────────────────────────────────────────── */
const N8N_PUBLIC = 'https://n8n.marazulagenciadigital.com.br'
const N8N_API = '/n8n-api'
const STATUS_TAGS = ['ATIVO', 'EM PRODUCAO', 'EM PRODUÇÃO', 'PAUSADO', 'INATIVO', 'TESTE', 'RASCUNHO']

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

function getN8nList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function normalizeTagName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

function getTagNames(tags) {
  return (tags ?? [])
    .map(tag => tag?.name)
    .filter(Boolean)
}

function splitWorkflowTags(tags) {
  const names = getTagNames(tags)
  const status = names.find(name => STATUS_TAGS.includes(normalizeTagName(name))) ?? null
  const client = names.find(name => !STATUS_TAGS.includes(normalizeTagName(name))) ?? null
  return { client, status, tagNames: names }
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
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const headers = { Accept: 'application/json' }

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
      const workflows = getN8nList(wfData)
      const executions = getN8nList(exData)

      /* Última execução por workflowId */
      const lastExec = {}
      for (const ex of executions) {
        const t = ex.startedAt || ex.stoppedAt
        if (!lastExec[ex.workflowId] || t > lastExec[ex.workflowId]) {
          lastExec[ex.workflowId] = t
        }
      }

      /* Todos os workflows, ordenados: ativos primeiro */
      const all = workflows
        .map(w => {
          const tags = splitWorkflowTags(w.tags)
          return {
            id:     w.id,
            name:   w.name,
            active: Boolean(w.active),
            last:   lastExec[w.id] ?? w.updatedAt ?? null,
            url:    `${N8N_PUBLIC}/workflow/${w.id}`,
            client: tags.client,
            statusTag: tags.status,
            tagNames: tags.tagNames,
          }
        })
        .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))

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

  const clients = useMemo(() => (
    [...new Set(flows.map(f => f.client).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [flows])

  const statuses = useMemo(() => (
    [...new Set(flows.map(f => f.statusTag).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [flows])

  const filteredFlows = useMemo(() => flows.filter(f => (
    (clientFilter === 'all' || f.client === clientFilter) &&
    (statusFilter === 'all' || f.statusTag === statusFilter)
  )), [flows, clientFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredFlows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pageFlows = filteredFlows.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    setPage(1)
  }, [clientFilter, statusFilter, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

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
                <div
                  className={`cc-n8n-hero__conn ${
                    loading ? 'cc-n8n-hero__conn--loading' : error ? 'cc-n8n-hero__conn--error' : 'cc-n8n-hero__conn--online'
                  }`}
                >
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
            <div>
              <p className="dash-label">Todos os Flows</p>
              {!loading && !error && (
                <p className="cc-flows-count">{filteredFlows.length} de {flows.length} workflows</p>
              )}
            </div>
            <button
              className={`cc-refresh-btn${loading ? ' cc-refresh-btn--spin' : ''}`}
              onClick={load}
              disabled={loading}
              title="Recarregar agora"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {!loading && !error && (
            <div className="cc-flow-filters">
              <label className="cc-flow-filter">
                <span>Cliente</span>
                <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
                  <option value="all">Todos</option>
                  {clients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </label>
              <label className="cc-flow-filter">
                <span>Status</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Todos</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

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

          {!loading && !error && flows.length > 0 && filteredFlows.length === 0 && (
            <p className="cc-empty">Nenhum workflow encontrado com esses filtros.</p>
          )}

          {/* Estado: dados reais */}
          {!loading && !error && pageFlows.map(f => (
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
                {(f.client || f.statusTag) && (
                  <p className="cc-flow-tags">
                    {[f.client, f.statusTag].filter(Boolean).join(' / ')}
                  </p>
                )}
              </div>
              <span className={`cc-flow-status cc-flow-status--${f.active ? 'active' : 'inactive'}`}>
                {f.active ? 'Ativo' : 'Inativo'}
              </span>
              <ExternalLink size={13} className="cc-flow-ext" />
            </a>
          ))}

          {!loading && !error && filteredFlows.length > 0 && (
            <div className="cc-flow-pagination">
              <span className="cc-flow-total">Total {filteredFlows.length}</span>
              <button
                className="cc-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Pagina anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="cc-page-current">{currentPage}</span>
              <button
                className="cc-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Proxima pagina"
              >
                <ChevronRight size={14} />
              </button>
              <select
                className="cc-page-size"
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5/pagina</option>
                <option value={10}>10/pagina</option>
                <option value={25}>25/pagina</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
