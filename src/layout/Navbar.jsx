import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/imagens/logo-marazul.svg'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <img src={logo} alt="Marazul" />
        </Link>

        <nav className="navbar__nav">
          <a href="#solucoes"    className="navbar__link">Soluções</a>
          <a href="#ecossistema" className="navbar__link">Ecossistema</a>
          <a href="#diretoria"   className="navbar__link">Diretoria</a>
        </nav>

        <Link to="/login" className="navbar__cta">
          Acessar Painel
        </Link>
      </div>
    </header>
  )
}
