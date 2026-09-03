import type { Metadata } from 'next';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { InformationPage } from '@/components/clinic/information-page';

export const metadata: Metadata = {
  title: 'Portal do paciente — indisponível',
  description: 'Acesso clínico ainda não configurado.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Portal do paciente — Lumina',
    description: 'Acesso clínico ainda não configurado.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Portal do paciente — Lumina',
    description: 'Acesso clínico ainda não configurado.',
    images: [],
  },
};

export default function PortalPage() {
  return (
    <InformationPage title="Portal do paciente">
      <div className="portal-notice">
        <LockKeyhole size={28} aria-hidden="true" />
        <div>
          <h2>Acesso clínico ainda não configurado</h2>
          <p>
            O portal permanece fechado enquanto a autenticação própria da
            clínica e o armazenamento seguro são preparados. Nenhum prontuário
            ou fotografia está disponível no site público.
          </p>
        </div>
      </div>
      <p>
        Para agendamentos, consulte os canais oficiais na seção de contato. Não
        é necessário criar uma conta para visitar o site institucional.
      </p>
      <Link href="/#contato" className="cta">
        Ir para contato
      </Link>
    </InformationPage>
  );
}
