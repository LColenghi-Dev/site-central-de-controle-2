import { useState, useEffect } from 'react'
import {
  Plus, User, Link, UserCircle, Save, Check, Trash2,
  Sun, Moon, Key, Copy, RefreshCw, Eye, EyeOff, ShieldCheck,
  Users, Palette, Video, TrendingUp, Handshake, X,
} from 'lucide-react'

const KEY_USUARIOS    = 'cfg_usuarios'
const KEY_EQUIPES     = 'cfg_equipes'
const KEY_INTEGRACOES = 'cfg_integracoes'
const KEY_PERFIL      = 'cfg_perfil'
const KEY_TEMA        = 'cfg_tema'
const KEY_APIKEY      = 'cfg_api_key'

const EQUIPES_DEF = [
  { key: 'design',  label: 'Design',          Icon: Palette,    color: 'violet' },
  { key: 'video',   label: 'Edição de Vídeo', Icon: Video,      color: 'amber'  },
  { key: 'trafego', label: 'Tráfego',          Icon: TrendingUp, color: 'cyan'   },
  { key: 'crm',     label: 'CRM',              Icon: Handshake,  color: 'green'  },
]

const EQUIPES_VAZIO = { design: [], video: [], trafego: [], crm: [] }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
  catch { return fallback }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
function initials(name) {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function generateKey() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `mzl_live_${hex}`
}

/* ── Seção: Aparência ─────────────────────────────────── */
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

/* ── Seção: API Key ───────────────────────────────────── */
function SecaoApiKey() {
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem(KEY_APIKEY) ?? '')
  const [visible,  setVisible]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  function criarKey() {
    const nova = generateKey()
    setApiKey(nova)
    localStorage.setItem(KEY_APIKEY, nova)
    setVisible(true)
    setConfirm(false)
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
          {/* Key display */}
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

          {/* Info de uso */}
          <div className="cfg-key-usage">
            <p className="cfg-key-usage__title">Como usar na automação:</p>
            <code className="cfg-key-usage__code">
              Authorization: Bearer {visible ? apiKey : (apiKey.slice(0, 12) + '...')}
            </code>
            <p className="cfg-key-usage__hint">
              Envie este header em todas as requisições feitas pela automação externa.
            </p>
          </div>

          {/* Regenerar */}
          {!confirm ? (
            <button className="cfg-regen-btn" onClick={() => setConfirm(true)}>
              <RefreshCw size={14} /> Regenerar chave
            </button>
          ) : (
            <div className="cfg-confirm">
              <p className="cfg-confirm__text">
                A chave atual será invalidada. Tem certeza?
              </p>
              <div className="cfg-confirm__actions">
                <button className="rd-btn-ghost" style={{ height: 36, fontSize: 12 }} onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
                <button className="cfg-regen-btn cfg-regen-btn--danger" onClick={criarKey}>
                  <RefreshCw size={14} /> Sim, regenerar
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
          <button className="rd-btn-primary" onClick={criarKey}>
            <Key size={15} /> Gerar API Key
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Seção: Usuários ──────────────────────────────────── */
function SecaoUsuarios() {
  const [usuarios, setUsuarios] = useState(() => load(KEY_USUARIOS, []))
  const [nome,     setNome]     = useState('')
  const [cargo,    setCargo]    = useState('')
  const [erro,     setErro]     = useState('')

  useEffect(() => { save(KEY_USUARIOS, usuarios) }, [usuarios])

  function adicionar(e) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Informe o nome'); return }
    setUsuarios(prev => [...prev, { id: crypto.randomUUID(), nome: nome.trim(), cargo: cargo.trim() }])
    setNome(''); setCargo(''); setErro('')
  }

  return (
    <div className="cfg-section">
      <div className="cfg-section__head">
        <div className="cfg-section__icon cfg-section__icon--cyan">
          <User size={17} />
        </div>
        <div>
          <h3 className="cfg-section__title">Usuários da Equipe</h3>
          <p className="cfg-section__desc">Membros que aparecem no dropdown de Responsável nos relatórios.</p>
        </div>
      </div>

      <form className="cfg-add-form" onSubmit={adicionar}>
        <div className="cfg-add-form__fields">
          <div className="rd-field" style={{ flex: 2 }}>
            <label className="rd-label">Nome completo</label>
            <input
              className={`rd-input${erro ? ' rd-input--error' : ''}`}
              placeholder="Ex: João Silva"
              value={nome}
              onChange={e => { setNome(e.target.value); setErro('') }}
            />
            {erro && <span className="rd-error">{erro}</span>}
          </div>
          <div className="rd-field" style={{ flex: 1.2 }}>
            <label className="rd-label">Cargo (opcional)</label>
            <input
              className="rd-input"
              placeholder="Ex: Designer"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="rd-btn-primary cfg-add-form__btn">
          <Plus size={15} /> Adicionar
        </button>
      </form>

      {usuarios.length === 0 ? (
        <p className="cfg-empty">Nenhum usuário cadastrado ainda.</p>
      ) : (
        <div className="cfg-user-list">
          {usuarios.map(u => (
            <div key={u.id} className="cfg-user-item">
              <div className="cfg-user-item__avatar">{initials(u.nome)}</div>
              <div className="cfg-user-item__info">
                <p className="cfg-user-item__nome">{u.nome}</p>
                {u.cargo && <p className="cfg-user-item__cargo">{u.cargo}</p>}
              </div>
              <button className="cfg-user-item__del" onClick={() => setUsuarios(p => p.filter(x => x.id !== u.id))} title="Remover">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Seção: Integrações ───────────────────────────────── */
function SecaoIntegracoes() {
  const [form,  setForm]  = useState(() => load(KEY_INTEGRACOES, { n8nUrl: '', trafficUrl: '', clickupUrl: '' }))
  const [saved, setSaved] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false) }

  function handleSave(e) {
    e.preventDefault()
    save(KEY_INTEGRACOES, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const FIELDS = [
    { field: 'n8nUrl',     label: 'n8n Workspace URL',          placeholder: 'https://n8n.suaagencia.com.br'  },
    { field: 'trafficUrl', label: 'Dashboard de Tráfego (URL)', placeholder: 'https://api.suaagencia.com.br'  },
    { field: 'clickupUrl', label: 'ClickUp Workspace URL',      placeholder: 'https://app.clickup.com/...'   },
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
            <input className="rd-input" placeholder={placeholder} value={form[field]} onChange={e => set(field, e.target.value)} />
          </div>
        ))}
        <div className="cfg-form__footer">
          <button type="submit" className={`cfg-save-btn${saved ? ' cfg-save-btn--saved' : ''}`}>
            {saved ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> Salvar</>}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Seção: Perfil ────────────────────────────────────── */
function SecaoPerfil() {
  const [form,  setForm]  = useState(() => load(KEY_PERFIL, { nome: '', email: '' }))
  const [saved, setSaved] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setSaved(false) }

  function handleSave(e) {
    e.preventDefault()
    save(KEY_PERFIL, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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
            {form.nome ? initials(form.nome) : 'LF'}
          </div>
          <div className="cfg-form cfg-form--inline">
            <div className="rd-field">
              <label className="rd-label">Nome</label>
              <input className="rd-input" placeholder="Seu nome completo" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div className="rd-field">
              <label className="rd-label">E-mail</label>
              <input className="rd-input" placeholder="seu@email.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="cfg-form__footer">
          <button type="submit" className={`cfg-save-btn${saved ? ' cfg-save-btn--saved' : ''}`}>
            {saved ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> Salvar</>}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Seção: Equipes ───────────────────────────────────── */
function SecaoEquipes() {
  const [equipes,  setEquipes]  = useState(() => load(KEY_EQUIPES,  EQUIPES_VAZIO))
  const [usuarios, setUsuarios] = useState(() => load(KEY_USUARIOS, []))

  // Sincroniza usuários caso sejam atualizados na seção acima
  useEffect(() => {
    const handler = () => setUsuarios(load(KEY_USUARIOS, []))
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  function addMember(equipeKey, userId) {
    setEquipes(prev => {
      const next = { ...prev, [equipeKey]: [...(prev[equipeKey] ?? []), userId] }
      save(KEY_EQUIPES, next)
      return next
    })
  }

  function removeMember(equipeKey, userId) {
    setEquipes(prev => {
      const next = { ...prev, [equipeKey]: (prev[equipeKey] ?? []).filter(id => id !== userId) }
      save(KEY_EQUIPES, next)
      return next
    })
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
        <p className="cfg-empty">Cadastre usuários na seção acima para organizá-los em equipes.</p>
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
                        <div className="cfg-equipe-member__avatar">{initials(u.nome)}</div>
                        <div className="cfg-equipe-member__info">
                          <span className="cfg-equipe-member__nome">{u.nome}</span>
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
                      <option key={u.id} value={u.id}>{u.nome}</option>
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

/* ── Componente principal ─────────────────────────────── */
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
