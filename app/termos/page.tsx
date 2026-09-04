import type { Metadata } from 'next';
import { InformationPage } from '@/components/clinic/information-page';

export const metadata: Metadata = {
  title: 'Termos de Uso — em preparação',
  description: 'Informações provisórias de uso do site Lumina.',
  openGraph: {
    title: 'Termos de Uso — Lumina',
    description: 'Termos em preparação e sujeitos à validação da clínica.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Termos de Uso — Lumina',
    description: 'Termos em preparação e sujeitos à validação da clínica.',
    images: [],
  },
};

export default function TermsPage() {
  return (
    <InformationPage title="Termos de Uso">
      <h2>Termos oficiais pendentes</h2>
      <p>
        Razão social, CNPJ, responsável técnico e condições oficiais de uso
        ainda precisam ser fornecidos e revisados pela clínica. Este conteúdo é
        um aviso provisório, não um contrato ou termo jurídico aprovado.
      </p>
      <h2>Finalidade da ferramenta</h2>
      <p>
        A ferramenta apoia profissionais autorizadas na criação de simulações
        visuais para comunicação do planejamento estético. Ela não diagnostica,
        prescreve nem substitui avaliação, consentimento ou decisão clínica.
      </p>
      <h2>Resultado ilustrativo</h2>
      <p>
        A imagem produzida por inteligência artificial é aproximada, pode conter
        imprecisões e não constitui promessa de resultado. Toda simulação deve
        ser revisada pela profissional antes de ser apresentada à paciente.
      </p>
      <h2>Acesso e conteúdo</h2>
      <p>
        O acesso é restrito às contas habilitadas pela administração. A
        profissional confirma que possui autorização para enviar as fotografias
        e é responsável pela adequação dos dados inseridos no planejamento.
      </p>
      <h2>Validação antes do lançamento</h2>
      <p>
        A clínica deverá aprovar o conteúdo institucional e os termos
        definitivos antes da abertura do site ao público.
      </p>
    </InformationPage>
  );
}
