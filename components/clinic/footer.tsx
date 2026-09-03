import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { clinic } from '@/content/clinic';
import { emailUrl, mapsUrl, phoneUrl } from '@/lib/contact';
import { Brand } from './brand';

export function Footer() {
  const { contact, legal } = clinic;
  const phone = phoneUrl(contact.phone),
    email = emailUrl(contact.email),
    maps = mapsUrl(contact.address);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand inverse />
            <p>
              Conheça a clínica.
              <br />
              Planeje o seu cuidado.
            </p>
            <span className="footer-status">
              <span /> Conteúdo oficial em atualização
            </span>
          </div>
          <div>
            <h2>Explore</h2>
            <nav aria-label="Links do rodapé">
              <Link href="/#especialidades">Especialidades</Link>
              <Link href="/#corpo-clinico">Corpo clínico</Link>
              <Link href="/#estrutura">Nossa estrutura</Link>
              <Link href="/#convenios">Convênios</Link>
            </nav>
          </div>
          <div>
            <h2>Informações</h2>
            <nav aria-label="Informações institucionais">
              <Link href="/#contato">Fale com a clínica</Link>
              <Link href="/privacidade">Política de Privacidade</Link>
              <Link href="/termos">Termos de Uso</Link>
              <Link href="/portal">
                Portal do paciente <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </nav>
          </div>
          <div className="footer-contact">
            <h2>Contato e localização</h2>
            <p>
              <MapPin size={15} aria-hidden="true" />
              {maps ? (
                <a href={maps} target="_blank" rel="noopener noreferrer">
                  {contact.address}
                </a>
              ) : (
                <span>Endereço a informar</span>
              )}
            </p>
            <p>
              <Phone size={15} aria-hidden="true" />
              {phone ? (
                <a href={phone}>{contact.phone}</a>
              ) : (
                <span>Telefone a informar</span>
              )}
            </p>
            <p>
              <Mail size={15} aria-hidden="true" />
              {email ? (
                <a href={email}>{contact.email}</a>
              ) : (
                <span>E-mail a informar</span>
              )}
            </p>
            <p>
              <Clock3 size={15} aria-hidden="true" />
              <span>{contact.hours || 'Horários a informar'}</span>
            </p>
          </div>
        </div>
        <div className="footer-legal">
          <p>
            Razão social: {legal.companyName || 'a informar'} <span>·</span>{' '}
            CNPJ: {legal.cnpj || 'a informar'}
          </p>
          <p>
            Responsável técnico: {legal.technicalDirector || 'a informar'}{' '}
            <span>·</span> CRM/UF: {legal.technicalDirectorCrm || 'a informar'}
          </p>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Lumina.</span>
          <span>Informação clara. Cuidado em primeiro lugar.</span>
        </div>
      </div>
    </footer>
  );
}
