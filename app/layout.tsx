import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/lora';
import './globals.css';
import { siteOrigin } from '@/lib/contact';

const description =
  'Sistema clínico para planejamento de procedimentos, catálogo e simulações visuais para revisão profissional.';
const origin = siteOrigin(process.env);

export const metadata: Metadata = {
  metadataBase: origin,
  title: 'Sistema de simulações',
  description,
  robots: { index: false, follow: false }, // Enable only after official content review.
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Sistema de simulações',
    description,
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Sistema de simulações',
    description,
    images: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
