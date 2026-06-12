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
  const { criadoEm, arquivos = [], ...campos } = relatorio
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