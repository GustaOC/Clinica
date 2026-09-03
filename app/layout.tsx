import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/lora';
import './globals.css';
import { siteOrigin } from '@/lib/contact';

const description =
  'Conheça a Lumina, suas áreas de atendimento, corpo clínico e estrutura. Encontre os canais oficiais para planejar sua consulta.';
const origin = siteOrigin(process.env);
const socialImage = origin ? new URL('/og.png', origin).href : undefined;

export const metadata: Metadata = {
  metadataBase: origin,
  title: { default: 'Lumina | Clínica estética', template: '%s | Lumina' },
  description,
  icons: { icon: '/favicon.svg' },
  robots: { index: false, follow: false }, // Enable only after official content review.
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Lumina | Clínica estética',
    description,
    images: socialImage
      ? [
          {
            url: socialImage,
            width: 1731,
            height: 909,
            alt: 'Lumina — Cuidado que começa com você.',
          },
        ]
      : [],
  },
  twitter: {
    card: socialImage ? 'summary_large_image' : 'summary',
    title: 'Lumina | Clínica estética',
    description,
    images: socialImage ? [socialImage] : [],
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
