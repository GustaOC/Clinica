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
      <h2>Finalidade institucional</h2>
      <p>
        O site apresenta informações sobre a clínica e seus canais oficiais.
        Campos marcados como pendentes não representam serviços, profissionais,
        convênios ou credenciais confirmados.
      </p>
      <h2>Agendamento</h2>
      <p>
        O botão de contato não reserva uma data automaticamente. A
        disponibilidade e a confirmação de consulta dependem da comunicação
        direta com a equipe. Sem canais oficiais configurados, o site não envia
        solicitações.
      </p>
      <h2>Área clínica</h2>
      <p>
        O site público não oferece acesso a prontuários, fotografias clínicas,
        exames ou simulações de tratamento. Não envie informações sensíveis por
        este site.
      </p>
      <h2>Validação antes do lançamento</h2>
      <p>
        A clínica deverá aprovar o conteúdo institucional e os termos
        definitivos antes da abertura do site ao público.
      </p>
    </InformationPage>
  );
}
