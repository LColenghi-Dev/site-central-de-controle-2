import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import logo from '../../assets/imagens/logo-marazul.svg'
import { useAuth } from '../../contexts/AuthContext'

/* Métricas live exibidas no painel esquerdo */
const LIVE_METRICS = [
  { label: 'ROAS médio',         value: '4.2×',     badge: '↑ 18%', color: 'green'  },
  { label: 'Leads gerados',      value: '1.847',    badge: '↑ 24%', color: 'cyan'   },
  { label: 'Receita gerenciada', value: 'R$ 2.4M',  badge: '↑ 31%', color: 'violet' },
]

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
  e.preventDefault()
  setErrorMsg('')
  setLoading(true)

  const form = e.currentTarget
  const email = form.querySelector('#email').value
  const password = form.querySelector('#password').value

  try {
    await signIn(email, password)
    navigate('/dashboard')
  } catch {
    setErrorMsg('E-mail ou senha incorretos.')
    setLoading(false)
  }
}

  return (
    <div className="login">

      {/* ── LADO ESQUERDO — visual CSS animado ──────────────── */}
      <div className="login__visual">
        {/* Orb conic-gradient + grid texture */}
        <div className="login__vis-orb"  aria-hidden="true" />
        <div className="login__vis-grid" aria-hidden="true" />

        {/* Logo no topo */}
        <div className="login__vis-top">
          <img src={logo} alt="Marazul" className="login__brand-logo" />
        </div>

        {/* Cards flutuantes de métricas */}
        <div className="login__vis-stage" aria-hidden="true">
          {LIVE_METRICS.map((m, i) => (
            <div key={i} className={`lv-card lv-card--${i}`}>
              <span className="lv-card__label">{m.label}</span>
              <span className="lv-card__value">{m.value}</span>
              <span className={`lv-card__badge lv-badge--${m.color}`}>{m.badge}</span>
            </div>
          ))}
        </div>

        {/* Tagline no rodapé */}
        <div className="login__vis-bottom">
          <p className="login__tagline">
            <span className="login__tagline-top">Seja bem-vindo</span>
            <span className="login__tagline-bottom">ao seu Ecossistema.</span>
          </p>
        </div>
      </div>

      {/* ── LADO DIREITO — formulário ────────────────────────── */}
      <div className="login__panel">
        {/* Linha divisória com gradiente */}
        <div className="login__divider-line" aria-hidden="true" />

        <form className="login__form" onSubmit={handleSubmit} noValidate>

          {/* Header */}
          <div className="login__header">
            <div className="login__header-eyebrow">
            </div>
            <h1 className="login__title">Entrar</h1>
            <p className="login__sub">Acesse sua central de marketing</p>
          </div>

          {/* Campos */}
          <div className="login__fields">
            {/* E-mail */}
            <div className="login__field">
              <label className="login__label" htmlFor="email">E-mail</label>
              <div className="login__input-wrap">
                <Mail className="login__icon" size={16} aria-hidden="true" />
                <input
                  id="email"
                  className="login__input"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="login__field">
              <div className="login__field-header">
                <label className="login__label" htmlFor="password">Senha</label>
                <a href="#" className="login__forgot">Esqueceu a senha?</a>
              </div>
              <div className="login__input-wrap">
                <Lock className="login__icon" size={16} aria-hidden="true" />
                <input
                  id="password"
                  className="login__input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login__eye"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Lembrar de mim */}
          <label className="login__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Lembrar de mim</span>
          </label>

          {/* Mensagem de erro */}
          {errorMsg && (
            <p style={{ color: '#f87171', fontSize: 13, marginBottom: 4 }}>{errorMsg}</p>
          )}

          {/* Submit */}
          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Ecossistema'}
          </button>

        </form>
      </div>
    </div>
  )
}