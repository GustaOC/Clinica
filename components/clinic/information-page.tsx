import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { clinic } from '@/content/clinic';
import { Header } from './header';
import { Footer } from './footer';

export function InformationPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header contact={clinic.contact} />
      <main id="conteudo" className="information-page container">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para a Lumina
        </Link>
        <p className="eyebrow">INFORMAÇÕES INSTITUCIONAIS</p>
        <h1 className="section-title">{title}</h1>
        <div className="honest-notice">
          <Info size={20} aria-hidden="true" />
          <p>
            Esta página está em preparação. As informações oficiais dependem de
            validação pela clínica.
          </p>
        </div>
        <div className="information-copy">{children}</div>
      </main>
      <Footer />
    </>
  );
}
