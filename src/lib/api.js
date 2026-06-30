import { supabase } from './supabase'

// ── Relatórios ────────────────────────────────────────────
export async function loadRelatorios() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({ ...r, criadoEm: r.created_at }))
}

export async function createRelatorio(relatorio) {
  const { criadoEm, arquivos = [], responsavelEmail, ...campos } = relatorio
  const relatorioId = crypto.randomUUID()

  const arquivosUpload = await Promise.all(
    arquivos.map(f => f.rawFile ? uploadAnexo(f.rawFile, relatorioId) : Promise.resolve(f))
  )

  const { data, error } = await supabase
    .from('reports')
    .insert({ id: relatorioId, ...campos, arquivos: arquivosUpload })
    .select()
    .single()
  if (error) throw error
  return { ...data, criadoEm: data.created_at }
}

export async function deleteRelatorio(id) {
  const { data } = await supabase.from('reports').select('arquivos').eq('id', id).single()
  const paths = (data?.arquivos ?? []).map(a => a.path).filter(Boolean)
  if (paths.length) await supabase.storage.from('relatorios').remove(paths)
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) throw error
}

// ── Usuários ──────────────────────────────────────────────
export async function loadUsuarios() {
  const { data, error } = await supabase.from('profiles').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function saveUsuarios(list) {
  if (!list?.length) return
  const { error } = await supabase.from('profiles').upsert(list)
  if (error) throw error
}

// ── Equipes ───────────────────────────────────────────────
export async function loadEquipes() {
  const { data } = await supabase
    .from('settings').select('valor').eq('chave', 'equipes').maybeSingle()
  try { return JSON.parse(data?.valor ?? 'null') ?? {} }
  catch { return {} }
}

export async function saveEquipes(equipes) {
  const { error } = await supabase
    .from('settings')
    .upsert(
      { chave: 'equipes', valor: JSON.stringify(equipes), updated_at: new Date().toISOString() },
      { onConflict: 'chave' }
    )
  if (error) throw error
}

// ── Perfil ────────────────────────────────────────────────
export async function loadPerfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (error) return null
  return data
}

export async function savePerfil(perfil) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { id, created_at, ...campos } = perfil
  const { error } = await supabase.from('profiles').update(campos).eq('id', user.id)
  if (error) throw error
}

// ── API Key ───────────────────────────────────────────────
export async function loadApiKey() {
  const { data } = await supabase
    .from('settings').select('valor').eq('chave', 'api_key').maybeSingle()
  return data?.valor ?? ''
}

export async function saveApiKey(valor) {
  const { error } = await supabase
    .from('settings')
    .upsert({ chave: 'api_key', valor, updated_at: new Date().toISOString() }, { onConflict: 'chave' })
  if (error) throw error
}

// ── Integrações ───────────────────────────────────────────
export async function loadIntegracoes() {
  const { data } = await supabase
    .from('settings').select('valor').eq('chave', 'integracoes').maybeSingle()
  try { return JSON.parse(data?.valor ?? 'null') } catch { return null }
}

export async function saveIntegracoes(integracoes) {
  const { error } = await supabase
    .from('settings')
    .upsert(
      { chave: 'integracoes', valor: JSON.stringify(integracoes), updated_at: new Date().toISOString() },
      { onConflict: 'chave' }
    )
  if (error) throw error
}

// ── Storage (Fase 3) ──────────────────────────────────────
export async function uploadAnexo(file, relatorioId) {
  const ext = file.name.split('.').pop()
  const path = `${relatorioId}/${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabase.storage
    .from('relatorios')
    .upload(path, file)
  if (error) throw error
  return { name: file.name, size: file.size, type: file.type, path: data.path }
}

export async function getAnexoUrl(path) {
  const { data, error } = await supabase.storage
    .from('relatorios')
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function notifyWebhookRelatorio(relatorio) {
  const webhookPath = import.meta.env.DEV
    ? '/n8n-api/webhook-test/relatorio-interno'
    : '/n8n-api/webhook/relatorio-interno'

  const arquivos = await Promise.all(
    (relatorio.arquivos ?? []).map(async ({ name, size, type, path: storagePath }) => {
      let url = null
      if (storagePath) {
        try { url = await getAnexoUrl(storagePath) } catch {}
      }
      return { name, size, type, url }
    })
  )

  const payload = {
    id:          relatorio.id,
    titulo:      relatorio.titulo,
    responsavel: relatorio.responsavel,
    responsavelEmail: relatorio.responsavelEmail ?? null,
    semana:      relatorio.semana,
    conteudo:    relatorio.conteudo,
    criadoEm:    relatorio.criadoEm ?? relatorio.created_at,
    arquivos,
  }

  try {
    await fetch(webhookPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // webhook é fire-and-forget; falha não bloqueia o salvamento
  }
}
// ── Metricas (Fase 4) ─────────────────────────────────────
export async function loadMetricas() {
  const { data, error } = await supabase
    .from('metricas').select('*').order('data', { ascending: true })
  if (error) throw error
  return data ?? []
}
export async function createMetrica(m) {
  const { data, error } = await supabase
    .from('metricas').insert(m).select().single()
  if (error) throw error
  return data
}
export async function deleteMetrica(id) {
  const { error } = await supabase.from('metricas').delete().eq('id', id)
  if (error) throw error
}

// ── Tráfego Pago (API externa) ────────────────────────────
const TRAFEGO_API_BASE = import.meta.env.VITE_TRAFEGO_API_BASE || '/trafego-api/api/v1'

function getList(payload, keys = []) {
  if (Array.isArray(payload)) return payload
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

async function fetchTrafego(path, params = {}) {
  const origin = globalThis.location?.origin ?? 'http://localhost'
  const base = TRAFEGO_API_BASE.startsWith('http')
    ? TRAFEGO_API_BASE
    : new URL(TRAFEGO_API_BASE, origin).toString()
  const url = new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const headers = { Accept: 'application/json' }
  const key = import.meta.env.VITE_TRAFEGO_API_KEY
  if (key) headers.Authorization = `Bearer ${key}`

  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body.error || body.message || `Falha na API de tráfego (${resp.status})`)
  }
  return resp.json()
}

export async function loadTrafegoClients() {
  const payload = await fetchTrafego('clients')
  return getList(payload, ['clients']).map((c, i) => ({
    id: String(c.id ?? c.clientId ?? c.client_id ?? c.slug ?? c.name ?? c.nome ?? i),
    name: c.name ?? c.nome ?? c.clientName ?? c.client_name ?? c.accountName ?? 'Cliente sem nome',
    raw: c,
  }))
}

export async function loadTrafegoDaily({ clientId, since, until }) {
  const payload = await fetchTrafego('daily', { clientId, since, until, limit: 1000 })
  return getList(payload, ['daily', 'rows']).map((r, i) => ({
    id: String(r.id ?? `${clientId ?? 'all'}-${r.date ?? r.data ?? i}`),
    data: r.date ?? r.data ?? r.day ?? r.dia,
    investimento: Number(r.spend ?? r.investment ?? r.investimento ?? r.cost ?? r.custo ?? 0),
    impressoes: Number(r.impressions ?? r.impressoes ?? r.impressões ?? 0),
    cliques: Number(r.clicks ?? r.cliques ?? r.sessions ?? r.sessoes ?? r.sessões ?? 0),
    conversoes: Number(r.conversions ?? r.conversoes ?? r.conversões ?? r.leads ?? 0),
    receita: Number(r.revenue ?? r.receita ?? r.valorConversao ?? r.conversionValue ?? 0),
    raw: r,
  })).filter(r => r.data)
}

// ── Produtividade (ClickUp via Edge Function) ─────────────
export async function loadProdutividade(days = 30) {
  const { data: { session } } = await supabase.auth.getSession()
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/produtividade?days=${days}`
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body.error || 'Falha ao carregar produtividade (' + resp.status + ')')
  }
  return resp.json()
}
