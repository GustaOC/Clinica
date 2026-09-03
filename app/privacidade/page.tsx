import type { Metadata } from 'next';
import { InformationPage } from '@/components/clinic/information-page';

export const metadata: Metadata = {
  title: 'Política de Privacidade — em preparação',
  description:
    'Status da política de privacidade do site institucional Lumina.',
  openGraph: {
    title: 'Política de Privacidade — Lumina',
    description: 'Política em preparação e sujeita à validação da clínica.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Política de Privacidade — Lumina',
    description: 'Política em preparação e sujeita à validação da clínica.',
    images: [],
  },
};

export default function PrivacyPage() {
  return (
    <InformationPage title="Política de Privacidade">
      <h2>Documento ainda não aprovado</h2>
      <p>
        A clínica ainda não forneceu a identificação do controlador, contato de
        privacidade, bases e finalidades do tratamento, prazos de retenção e
        canais para exercício de direitos. Por isso, não apresentamos um texto
        jurídico como se já estivesse aprovado.
      </p>
      <h2>Sobre esta versão do site</h2>
      <p>
        Esta página é institucional. Não há formulário de coleta de dados
        pessoais, upload de fotografias ou acesso a prontuários. A área clínica
        permanece indisponível até que um serviço de autenticação e um
        armazenamento privado sejam implementados.
      </p>
      <h2>Links para contato</h2>
      <p>
        Quando configurados, os links de WhatsApp, telefone, e-mail e mapas
        direcionam a serviços externos. Ao abrir esses serviços, também se
        aplicam as respectivas políticas de privacidade.
      </p>
      <h2>Informações técnicas</h2>
      <p>
        O provedor de hospedagem pode processar registros técnicos de acesso.
        Não foram adicionados rastreadores publicitários ou ferramentas de
        análise ao código do site. A política definitiva deve refletir a
        configuração de produção efetivamente adotada.
      </p>
      <h2>Antes da publicação definitiva</h2>
      <p>
        A política deve ser completada e revisada pela clínica e por sua
        assessoria responsável. Este aviso provisório não constitui uma
        declaração de conformidade com a LGPD.
      </p>
    </InformationPage>
  );
}
