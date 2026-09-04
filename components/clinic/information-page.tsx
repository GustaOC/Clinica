import { ArrowLeft, Info, Sparkles } from 'lucide-react';
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
      <header className="information-header">
        <Link
          href="/"
          className="app-brand"
          aria-label="Lumina — sistema clínico"
        >
          <span>
            <Sparkles size={24} />
          </span>
          <div>
            lumina<small>CLINICAL WORKSPACE</small>
          </div>
        </Link>
      </header>
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
