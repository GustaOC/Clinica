'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function Faq() {
  return (
    <Accordion className="faq-list">
      {[
        [
          'Como agendar uma consulta?',
          'Use o botão de agendamento para consultar os canais oficiais disponíveis. A data e o horário só estarão confirmados depois do contato com a equipe. Enquanto os contatos não forem cadastrados, o site informará a indisponibilidade sem enviar nenhuma solicitação.',
        ],
        [
          'Onde consultar os convênios atendidos?',
          'A lista será publicada após validação pela clínica. Até lá, a cobertura deve ser confirmada diretamente com a equipe; nenhum convênio é presumido pelo site.',
        ],
        [
          'Como conhecer a formação dos profissionais?',
          'Os perfis oficiais trarão nome, área de atuação, CRM/UF, RQE quando aplicável e um mini-currículo. Nenhum perfil será preenchido com dados fictícios.',
        ],
        [
          'Posso enviar documentos ou fotografias pelo site?',
          'Não. Este site é institucional e não recebe prontuários, exames, documentos de identificação ou fotografias clínicas. O acesso seguro do paciente depende da configuração de um portal separado.',
        ],
      ].map(([question, answer]) => (
        <AccordionItem key={question} value={question}>
          <AccordionTrigger className="faq-trigger">
            {question}
          </AccordionTrigger>
          <AccordionContent className="faq-answer">{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
