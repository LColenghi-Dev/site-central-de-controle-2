import { useState, useEffect } from 'react'
import {
  User, Link, UserCircle, Save, Check,
  Sun, Moon, Key, Copy, RefreshCw, Eye, EyeOff, ShieldCheck,
  Users, Palette, Video, TrendingUp, Handshake, X,
} from 'lucide-react'
import {
  loadUsuarios, saveUsuarios,
  loadEquipes, saveEquipes,
  loadIntegracoes, saveIntegracoes,
  loadPerfil, savePerfil,
  loadApiKey, saveApiKey,
} from '../../lib/api'

const KEY_TEMA = 'cfg_tema'

const EQUIPES_DEF = [
  { key: 'design',  label: 'Design',          Icon: Palette,    color: 'violet' },
  { key: 'video',   label: 'Edição de Vídeo', Icon: Video,      color: 'amber'  },
  { key: 'trafego', label: 'Tráfego',          Icon: TrendingUp, color: 'cyan'   },
  { key: 'crm',     label: 'CRM',              Icon: Handshake,  color: 'green'  },
]

const EQUIPES_VAZIO = { design: [], video: [], trafego: [], crm: [] }

function initials(name) {
  if (!name?.trim()) return '??'
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function generateKey() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `mzl_live_${hex}`
}

/* ── Aparência — tema fica no localStorage (intencional) ── */
function SecaoAparencia() {
  const [tema, setTema] = useState(() => localStorage.getItem(KEY_TEMA) ?? 'dark')

  function toggleTema(novo) {
    setTema(novo)
    localStorage.setItem(KEY_TEMA, novo)
    document.documentElement.setAttribute('data-theme', novo)
  }

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--amber">
          {tema === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </div>
        <div>
          <h3 className="cfg-section__title">Aparência</h3>
          <p className="cfg-section__desc">Escolha entre o modo escuro e o modo claro.</p>
        </div>
      </div>

      <div className="cfg-theme-row">
        <button
          className={`cfg-theme-card${tema === 'dark' ? ' cfg-theme-card--active' : ''}`}
          onClick={() => toggleTema('dark')}
          type="button"
        >
          <div className="cfg-theme-preview cfg-theme-preview--dark">
            <div className="ctp-sidebar" />
            <div className="ctp-main">
              <div className="ctp-bar" />
              <div className="ctp-bar ctp-bar--short" />
            </div>
          </div>
          <div className="cfg-theme-card__foot">
            <Moon size={13} />
            <span>Escuro</span>
            {tema === 'dark' && <Check size={13} className="cfg-theme-card__check" />}
          </div>
        </button>

        <button
          className={`cfg-theme-card${tema === 'light' ? ' cfg-theme-card--active' : ''}`}
          onClick={() => toggleTema('light')}
          type="button"
        >
          <div className="cfg-theme-preview cfg-theme-preview--light">
            <div className="ctp-sidebar" />
            <div className="ctp-main">
              <div className="ctp-bar" />
              <div className="ctp-bar ctp-bar--short" />
            </div>
          </div>
          <div className="cfg-theme-card__foot">
            <Sun size={13} />
            <span>Claro</span>
            {tema === 'light' && <Check size={13} className="cfg-theme-card__check" />}
          </div>
        </button>
      </div>
    </div>
  )
}

/* ── API Key ── */
function SecaoApiKey() {
  const [apiKey,  setApiKey]  = useState('')
  const [visible, setVisible] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { loadApiKey().then(setApiKey) }, [])

  async function criarKey() {
    const nova = generateKey()
    setSaving(true)
    try {
      await saveApiKey(nova)
      setApiKey(nova)
      setVisible(true)
      setConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  function copiar() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayKey = visible
    ? apiKey
    : apiKey.slice(0, 12) + '••••••••••••••••••••••••••••••••••••••••••••••••'

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--violet">
          <ShieldCheck size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">API Key</h3>
          <p className="cfg-section__desc">
            Chave de autenticação para integrar este dashboard com automações externas (n8n, Make, Zapier, etc.).
          </p>
        </div>
      </div>

      {apiKey ? (
        <>
          <div className="cfg-key-box">
            <Key size={14} className="cfg-key-box__icon" />
            <code className="cfg-key-box__value">{displayKey}</code>
            <button className="cfg-key-box__btn" onClick={() => setVisible(v => !v)} title={visible ? 'Ocultar' : 'Revelar'}>
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              className={`cfg-key-box__btn${copied ? ' cfg-key-box__btn--copied' : ''}`}
              onClick={copiar}
              title="Copiar"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className="cfg-key-usage">
            <p className="cfg-key-usage__title">Como usar na automação:</p>
            <code className="cfg-key-usage__code">
              Authorization: Bearer {visible ? apiKey : (apiKey.slice(0, 12) + '...')}
            </code>
            <p className="cfg-key-usage__hint">
              Envie este header em todas as requisições feitas pela automação externa.
            </p>
          </div>

          {!confirm ? (
            <button className="cfg-regen-btn" onClick={() => setConfirm(true)} disabled={saving}>
              <RefreshCw size={14} /> Regenerar chave
            </button>
          ) : (
            <div className="cfg-confirm">
              <p className="cfg-confirm__text">A chave atual será invalidada. Tem certeza?</p>
              <div className="cfg-confirm__actions">
                <button className="rd-btn-ghost" style={{ height: 36, fontSize: 12 }} onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
                <button className="cfg-regen-btn cfg-regen-btn--danger" onClick={criarKey} disabled={saving}>
                  <RefreshCw size={14} /> {saving ? 'Salvando...' : 'Sim, regenerar'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="cfg-key-empty">
          <Key size={22} className="cfg-key-empty__icon" />
          <p className="cfg-key-empty__text">Nenhuma API Key gerada ainda.</p>
          <p className="cfg-key-empty__sub">Gere uma chave para conectar automações externas a este dashboard.</p>
          <button className="rd-btn-primary" onClick={criarKey} disabled={saving}>
            <Key size={15} /> {saving ? 'Gerando...' : 'Gerar API Key'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Usuários — exibe profiles do Supabase Auth ── */
function SecaoUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [editando, setEditando] = useState(null)
  const [form,     setForm]     = useState({ nome: '', cargo: '' })
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { loadUsuarios().then(setUsuarios) }, [])

  function startEdit(u) {
    setEditando(u.id)
    setForm({ nome: u.nome ?? '', cargo: u.cargo ?? '' })
  }

  async function salvarEdicao() {
    setSaving(true)
    try {
      const updated = usuarios.map(u =>
        u.id === editando ? { ...u, nome: form.nome, cargo: form.cargo } : u
      )
      await saveUsuarios(updated)
      setUsuarios(updated)
      setEditando(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--cyan">
          <User size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">Usuários da Equipe</h3>
          <p className="cfg-section__desc">
            Membros com acesso ao dashboard. Para adicionar novos, crie usuários no painel do Supabase (Authentication → Users).
          </p>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <p className="cfg-empty">Nenhum usuário encontrado.</p>
      ) : (
        <div className="cfg-user-list">
          {usuarios.map(u => (
            <div key={u.id} className="cfg-user-item">
              {editando === u.id ? (
                <>
                  <div className="cfg-user-item__avatar">{initials(form.nome || u.email)}</div>
                  <div className="cfg-user-item__info" style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <input
                      className="rd-input"
                      style={{ height: 32, fontSize: 13 }}
                      value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Nome"
                    />
                    <input
                      className="rd-input"
                      style={{ height: 32, fontSize: 13 }}
                      value={form.cargo}
                      onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                      placeholder="Cargo"
                    />
                  </div>
                  <button className="cfg-save-btn" onClick={salvarEdicao} disabled={saving} style={{ height: 32 }}>
                    {saving ? <RefreshCw size={13} /> : <Check size={13} />}
                  </button>
                  <button className="cfg-user-item__del" onClick={() => setEditando(null)}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="cfg-user-item__avatar">{initials(u.nome || u.email)}</div>
                  <div className="cfg-user-item__info">
                    <p className="cfg-user-item__nome">{u.nome || u.email}</p>
                    {u.cargo && <p className="cfg-user-item__cargo">{u.cargo}</p>}
                  </div>
                  <button
                    className="cfg-user-item__del"
                    onClick={() => startEdit(u)}
                    title="Editar"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Save size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Equipes ── */
function SecaoEquipes() {
  const [equipes,  setEquipes]  = useState(EQUIPES_VAZIO)
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    loadEquipes().then(data =>
      setEquipes(data && typeof data === 'object' ? { ...EQUIPES_VAZIO, ...data } : EQUIPES_VAZIO)
    )
    loadUsuarios().then(setUsuarios)
  }, [])

  async function addMember(equipeKey, userId) {
    const next = { ...equipes, [equipeKey]: [...(equipes[equipeKey] ?? []), userId] }
    setEquipes(next)
    await saveEquipes(next)
  }

  async function removeMember(equipeKey, userId) {
    const next = { ...equipes, [equipeKey]: (equipes[equipeKey] ?? []).filter(id => id !== userId) }
    setEquipes(next)
    await saveEquipes(next)
  }

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--cyan">
          <Users size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">Equipes</h3>
          <p className="cfg-section__desc">Organize os membros por setor de atuação.</p>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <p className="cfg-empty">Nenhum usuário cadastrado ainda.</p>
      ) : (
        <div className="cfg-equipes-grid">
          {EQUIPES_DEF.map(({ key, label, Icon, color }) => {
            const memberIds = equipes[key] ?? []
            const members   = memberIds.map(id => usuarios.find(u => u.id === id)).filter(Boolean)
            const available = usuarios.filter(u => !memberIds.includes(u.id))

            return (
              <div key={key} className={`cfg-equipe-card cfg-equipe-card--${color}`}>
                <div className="cfg-equipe-card__head">
                  <div className={`cfg-equipe-card__icon cfg-equipe-card__icon--${color}`}>
                    <Icon size={15} />
                  </div>
                  <h4 className="cfg-equipe-card__name">{label}</h4>
                  <span className={`cfg-equipe-card__badge cfg-equipe-card__badge--${color}`}>
                    {members.length}
                  </span>
                </div>

                <div className="cfg-equipe-members">
                  {members.length === 0 ? (
                    <p className="cfg-equipe-empty">Nenhum membro atribuído</p>
                  ) : (
                    members.map(u => (
                      <div key={u.id} className="cfg-equipe-member">
                        <div className="cfg-equipe-member__avatar">{initials(u.nome || u.email)}</div>
                        <div className="cfg-equipe-member__info">
                          <span className="cfg-equipe-member__nome">{u.nome || u.email}</span>
                          {u.cargo && <span className="cfg-equipe-member__cargo">{u.cargo}</span>}
                        </div>
                        <button
                          className="cfg-equipe-member__remove"
                          onClick={() => removeMember(key, u.id)}
                          title="Remover da equipe"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {available.length > 0 && (
                  <select
                    className="cfg-equipe-select"
                    value=""
                    onChange={e => { if (e.target.value) addMember(key, e.target.value) }}
                  >
                    <option value="">+ Adicionar membro</option>
                    {available.map(u => (
                      <option key={u.id} value={u.id}>{u.nome || u.email}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Integrações ── */
function SecaoIntegracoes() {
  const [form,   setForm]   = useState({ n8nUrl: '', trafficUrl: '', clickupUrl: '' })
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadIntegracoes().then(data => {
      if (data) setForm(f => ({ ...f, ...data }))
    })
  }, [])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveIntegracoes(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const FIELDS = [
    { field: 'n8nUrl',     label: 'n8n Workspace URL',          placeholder: 'https://n8n.suaagencia.com.br' },
    { field: 'trafficUrl', label: 'Dashboard de Tráfego (URL)', placeholder: 'https://api.suaagencia.com.br' },
    { field: 'clickupUrl', label: 'ClickUp Workspace URL',      placeholder: 'https://app.clickup.com/...'  },
  ]

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--violet">
          <Link size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">Integrações</h3>
          <p className="cfg-section__desc">URLs das ferramentas externas usadas no dashboard.</p>
        </div>
      </div>

      <form className="cfg-form" onSubmit={handleSave}>
        {FIELDS.map(({ field, label, placeholder }) => (
          <div className="rd-field" key={field}>
            <label className="rd-label">{label}</label>
            <input
              className="rd-input"
              placeholder={placeholder}
              value={form[field]}
              onChange={e => set(field, e.target.value)}
            />
          </div>
        ))}
        <div className="cfg-form__footer">
          <button type="submit" className={`cfg-save-btn${saved ? ' cfg-save-btn--saved' : ''}`} disabled={saving}>
            {saved ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> {saving ? 'Salvando...' : 'Salvar'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Perfil ── */
function SecaoPerfil() {
  const [form,   setForm]   = useState({ nome: '', email: '', cargo: '' })
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPerfil().then(data => {
      if (data) setForm({ nome: data.nome ?? '', email: data.email ?? '', cargo: data.cargo ?? '' })
    })
  }, [])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await savePerfil(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--green">
          <UserCircle size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">Perfil</h3>
          <p className="cfg-section__desc">Suas informações exibidas no dashboard.</p>
        </div>
      </div>

      <form className="cfg-form" onSubmit={handleSave}>
        <div className="cfg-profile-row">
          <div className="cfg-avatar-preview">
            {initials(form.nome || form.email)}
          </div>
          <div className="cfg-form cfg-form--inline">
            <div className="rd-field">
              <label className="rd-label">Nome</label>
              <input
                className="rd-input"
                placeholder="Seu nome completo"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
              />
            </div>
            <div className="rd-field">
              <label className="rd-label">E-mail</label>
              <input
                className="rd-input"
                placeholder="seu@email.com"
                type="email"
                value={form.email}
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>
        <div className="cfg-form__footer">
          <button type="submit" className={`cfg-save-btn${saved ? ' cfg-save-btn--saved' : ''}`} disabled={saving}>
            {saved ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> {saving ? 'Salvando...' : 'Salvar'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Principal ── */
export default function Configuracoes() {
  return (
    <div className="cfg">
      <div className="cfg-header">
        <p className="cc-eyebrow">Painel de Controle</p>
        <h2 className="cc-title">Configurações</h2>
      </div>
      <div className="cfg-body">
        <SecaoAparencia />
        <SecaoApiKey />
        <SecaoUsuarios />
        <SecaoEquipes />
        <SecaoIntegracoes />
        <SecaoPerfil />
      </div>
    </div>
  )
}