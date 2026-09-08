import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export function InformationPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="system-information-shell">
      <main id="conteudo" className="info-page">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao sistema
        </Link>
        <p className="app-eyebrow">INFORMAÇÕES DO SISTEMA</p>
        <h1>{title}</h1>
        <div className="honest-notice">
          <Info size={20} aria-hidden="true" />
          <p>
            Este texto é provisório e precisa de validação jurídica antes do uso
            em produção com dados reais.
          </p>
        </div>
        <div className="information-copy">{children}</div>
      </main>
    </div>
  );
}
