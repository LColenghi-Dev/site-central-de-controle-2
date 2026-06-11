import {
  TrendingUp,
  Users,
  Video,
  Palette,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react'
import Navbar  from '../../layout/Navbar.jsx'
import Footer  from '../../layout/Footer.jsx'
import BentoCard from '../../components/BentoCard.jsx'
import heroBg  from '../../assets/imagens/download.jpeg'

/* Alturas das barras do gráfico mockup (%) */
const BAR_HEIGHTS = [36, 58, 42, 76, 52, 90, 68, 82, 55, 72]

/* Cores dos avatares da lista mockup */
const AVATAR_COLORS = [
  { bg: 'rgba(34,211,238,0.14)',  border: 'rgba(34,211,238,0.3)'   },
  { bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)' },
  { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)'  },
  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.28)'  },
]

const METRIC_BADGES = ['m-badge--green', 'm-badge--cyan', 'm-badge--yellow', 'm-badge--red']

const STATS = [
  { value: 'R$ 2.4M+', label: 'Receita gerenciada' },
  { value: '4.2×',     label: 'ROAS médio'          },
  { value: '38',       label: 'Clientes ativos'      },
]

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="hero">
        {/* Foto de fundo — filtrada para integrar ao design escuro */}
        <div
          className="hero__bg"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        {/* Overlay gradiente — escurece foto e cria profundidade */}
        <div className="hero__overlay" />

        {/* Orb de luz central (CSS puro, flutua sobre o overlay) */}
        <div className="hero__orb" aria-hidden="true" />

        {/* Grade de linhas sutis */}
        <div className="hero__grid" aria-hidden="true" />

        {/* Conteúdo */}
        <div className="hero__content">
          {/* Pill badge */}
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Plataforma de Marketing Digital
          </div>

          <h1 className="hero__h1">
            Resultados que<br />
            <em>transformam</em> negócios
          </h1>

          <p className="hero__lead">
            Tráfego pago, CRM inteligente e gestão centralizada — tudo em
            uma única plataforma pensada para crescimento escalável.
          </p>

          {/* Stats row */}
          <div className="hero__stats">
            {STATS.map((s, i) => (
              <div key={i} className="hero__stat">
                <span className="hero__stat-value">{s.value}</span>
                <span className="hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MOCKUP FLUTUANTE ─────────────────────────────── */}
        <div className="hero__mockup-wrap">
          {/* Glow radial embaixo do painel */}
          <div className="hero__mockup-glow" aria-hidden="true" />

          <div className="mockup">
            {/* Barra superior estilo browser */}
            <div className="mockup__topbar">
              <div className="mockup__traffic">
                <span className="mockup__tr-red" />
                <span className="mockup__tr-yellow" />
                <span className="mockup__tr-green" />
              </div>
              <div className="mockup__url">
                <span className="mockup__url-lock" />
                <span className="mockup__url-text" />
              </div>
            </div>

            {/* Corpo: sidebar + main */}
            <div className="mockup__body">
              {/* Sidebar */}
              <nav className="mockup__sidebar" aria-hidden="true">
                {[true, false, false, false, false].map((active, i) => (
                  <div key={i} className={`m-nav${active ? ' m-nav--active' : ''}`}>
                    <span className="m-nav__dot" />
                    <span className="m-nav__line" />
                  </div>
                ))}
                <div className="m-sep" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="m-nav">
                    <span className="m-nav__dot" />
                    <span className="m-nav__line m-nav__line--s" />
                  </div>
                ))}
              </nav>

              {/* Área principal */}
              <div className="mockup__main" aria-hidden="true">
                {/* Cabeçalho da área */}
                <div className="mockup__row">
                  <span className="m-title" />
                  <span className="m-sub" />
                </div>

                {/* Cards de métricas */}
                <div className="mockup__metrics">
                  {METRIC_BADGES.map((badge, i) => (
                    <div key={i} className="m-metric">
                      <div className="m-metric__lbl" />
                      <div className="m-metric__val" />
                      <div className={`m-metric__badge ${badge}`} />
                    </div>
                  ))}
                </div>

                {/* Gráfico de barras + lista */}
                <div className="mockup__charts">
                  <div className="m-chart">
                    <div className="m-chart__head">
                      <span className="m-chart__title" />
                      <span className="m-chart__pill" />
                    </div>
                    <div className="m-bars">
                      {BAR_HEIGHTS.map((h, i) => (
                        <div
                          key={i}
                          className={`m-bar${h > 70 ? ' m-bar--hi' : ''}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="m-list">
                    <div className="m-list__hdr" />
                    {AVATAR_COLORS.map((c, i) => (
                      <div key={i} className="m-list__row">
                        <div
                          className="m-list__avatar"
                          style={{ background: c.bg, border: `1px solid ${c.border}` }}
                        />
                        <div className="m-list__info">
                          <div className="m-list__name" />
                          <div className="m-list__sub" />
                        </div>
                        <div className="m-list__tag" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ─────────────────────────────────────── */}
      <section className="bento-section" id="ecossistema">
        <div className="bento-section__inner">
          <div className="section-header">
            <p className="section-eyebrow">Ecossistema</p>
            <h2 className="section-title">Tudo o que sua agência precisa</h2>
            <p className="section-desc">
              Ferramentas integradas para escalar resultados com inteligência
              e visibilidade total sobre cada entrega.
            </p>
          </div>

          {/* ── Envelope único ── */}
          <div className="bento-envelope" id="solucoes">
            <div className="bento-grid">

              {/* Linha 1 */}
              <BentoCard
                icon={<TrendingUp size={20} />}
                kicker="Performance"
                title="Tráfego Pago"
                description="Gestão estratégica de campanhas no Meta Ads e Google Ads com relatórios em tempo real, otimização contínua e metas claras de ROAS e CAC."
              />
              <BentoCard
                icon={<Users size={20} />}
                kicker="Relacionamento"
                title="CRM de Clientes"
                description="Pipeline visual de clientes, histórico completo de interações e automações de follow-up para que nenhuma oportunidade escape do radar."
              />

              {/* Linha 2 */}
              <BentoCard
                icon={<Layers size={20} />}
                kicker="Central Unificada"
                title="Gestão no ClickUp"
                description="Todos os times e entregas em um único ambiente — do briefing à publicação, com visibilidade total sobre prazos e responsáveis."
              />
              <BentoCard
                icon={<Cpu size={20} />}
                kicker="Automação"
                title="Automações n8n"
                description="Construção de fluxos inteligentes, integrações de APIs e automação de processos internos para eliminar tarefas manuais."
              />

              {/* Strip inferior — 3 cards de ponta a ponta */}
              <div className="bento-strip" id="diretoria">
                <div className="clickup-col">
                  <div className="clickup-col__icon"><Video size={18} /></div>
                  <p className="clickup-col__title">Produção de Vídeo</p>
                  <p className="clickup-col__desc">
                    Roteiros, gravações e edições organizados por etapa com
                    prazo e responsável definidos.
                  </p>
                </div>
                <div className="clickup-col">
                  <div className="clickup-col__icon"><Palette size={18} /></div>
                  <p className="clickup-col__title">Design</p>
                  <p className="clickup-col__desc">
                    Fluxo de aprovação de criativos com feedback centralizado
                    e histórico de versões acessível.
                  </p>
                </div>
                <div className="clickup-col">
                  <div className="clickup-col__icon"><Calendar size={18} /></div>
                  <p className="clickup-col__title">Agendamentos</p>
                  <p className="clickup-col__desc">
                    Calendário editorial e publicações sincronizados com o
                    calendário geral da conta.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
