import type { Metadata } from 'next';
import { DM_Serif_Display, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const dmSerif = DM_Serif_Display({ variable: '--font-dm-serif', subsets: ['latin'], weight: '400' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Lumina — Gestão para clínica estética',
  description: 'Pacientes, agenda, prontuário, fotografias clínicas e planejamento estético em um só lugar.',
  openGraph: {
    title: 'Lumina — Gestão para clínica estética',
    description: 'Pacientes, agenda, prontuário, fotografias clínicas e planejamento estético em um só lugar.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Lumina — Gestão inteligente para clínica estética' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumina — Gestão para clínica estética',
    description: 'Gestão inteligente para clínica estética.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${dmSerif.variable}`}>{children}</body>
    </html>
  );
}
