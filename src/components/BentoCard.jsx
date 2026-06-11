export default function BentoCard({ icon, kicker, title, description, wide = false, children }) {
  return (
    <div className={`bento-card${wide ? ' bento-card--wide' : ''}`}>
      {icon && <div className="bento-card__icon">{icon}</div>}
      {kicker && <p className="bento-card__kicker">{kicker}</p>}
      <h3 className="bento-card__title">{title}</h3>
      <p className="bento-card__desc">{description}</p>
      {children}
    </div>
  )
}
