import { useState, useEffect, useCallback } from 'react'
import logo from '../../assets/imagens/logo-marazul.svg'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  const finish = useCallback(() => {
    setExiting(true)
    setTimeout(onComplete, 650)
  }, [onComplete])

  useEffect(() => {
    let rafId
    let startTime = null
    const DURATION = 1900 // ms para ir de 0 → 100%

    function tick(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const t = Math.min(elapsed / DURATION, 1)

      // ease-in-out quart: arranca devagar, acelera no meio, desacelera no fim
      const eased = t < 0.5
        ? 8 * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 4) / 2

      setProgress(Math.round(eased * 100))

      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        setTimeout(finish, 320)
      }
    }

    // Pequeno delay inicial para a animação de entrada do body
    const delay = setTimeout(() => {
      rafId = requestAnimationFrame(tick)
    }, 350)

    return () => {
      clearTimeout(delay)
      cancelAnimationFrame(rafId)
    }
  }, [finish])

  return (
    <div className={`loader${exiting ? ' loader--exit' : ''}`}>

      {/* Aurora blobs de fundo */}
      <div className="loader__blob loader__blob--a" />
      <div className="loader__blob loader__blob--b" />

      {/* Conteúdo central */}
      <div className="loader__body">

        {/* Logo com anel de luz pulsante */}
        <div className="loader__logo-wrap">
          <img src={logo} alt="Marazul" className="loader__logo" />
        </div>

        {/* Barra de progresso */}
        <div className="loader__bottom">
          <p className="loader__status">Inicializando Ecossistema</p>

          <div className="loader__track">
            <div
              className="loader__fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="loader__pct">{progress}%</span>
        </div>

      </div>
    </div>
  )
}
