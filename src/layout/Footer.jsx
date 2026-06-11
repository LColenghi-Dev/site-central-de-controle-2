import { Instagram, Linkedin, Youtube, Twitter } from 'lucide-react'
import logo from '../assets/imagens/logo-marazul.svg'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        {/* Marca */}
        <div>
          <img src={logo} alt="Marazul" className="footer__brand-logo" />
          <p className="footer__tagline">
            Ecossistema completo de marketing digital para marcas que buscam
            crescimento escalável e resultados consistentes.
          </p>
        </div>

        {/* Produto */}
        <div>
          <p className="footer__col-label">Produto</p>
          <ul className="footer__col-links">
            <li><a href="#solucoes">Tráfego Pago</a></li>
            <li><a href="#solucoes">CRM de Clientes</a></li>
            <li><a href="#ecossistema">Central ClickUp</a></li>
            <li><a href="#ecossistema">Relatórios</a></li>
          </ul>
        </div>

        {/* Empresa */}
        <div>
          <p className="footer__col-label">Empresa</p>
          <ul className="footer__col-links">
            <li><a href="#">Sobre</a></li>
            <li><a href="#diretoria">Diretoria</a></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <p className="footer__col-label">Suporte</p>
          <ul className="footer__col-links">
            <li><a href="#">Contato</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__divider" />

      <div className="footer__bottom">
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} Marazul. Todos os direitos reservados.
        </p>

        <div className="footer__socials">
          <a href="#" className="footer__social" aria-label="Instagram">
            <Instagram size={14} />
          </a>
          <a href="#" className="footer__social" aria-label="LinkedIn">
            <Linkedin size={14} />
          </a>
          <a href="#" className="footer__social" aria-label="YouTube">
            <Youtube size={14} />
          </a>
          <a href="#" className="footer__social" aria-label="Twitter / X">
            <Twitter size={14} />
          </a>
        </div>

        <div className="footer__status">
          <span className="footer__status-dot" aria-hidden="true" />
          All systems operational
        </div>
      </div>
    </footer>
  )
}
