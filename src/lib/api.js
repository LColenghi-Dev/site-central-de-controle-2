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
  const { criadoEm, ...campos } = relatorio
  const { data, error } = await supabase
    .from('reports')
    .insert(campos)
    .select()
    .single()
  if (error) throw error
  return { ...data, criadoEm: data.created_at }
}

export async function deleteRelatorio(id) {
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

// ── Projetos (Fase 4) ─────────────────────────────────────
export async function loadProjetos() { return [] }
export async function saveProjetos() {}