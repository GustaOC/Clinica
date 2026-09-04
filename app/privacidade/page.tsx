import type { Metadata } from 'next';
import { InformationPage } from '@/components/clinic/information-page';

export const metadata: Metadata = {
  title: 'Política de Privacidade — em preparação',
  description: 'Status da política de privacidade do sistema clínico Lumina.',
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
      <h2>Tratamentos previstos nesta versão</h2>
      <p>
        O sistema prevê autenticação de profissionais, catálogo de procedimentos
        e produtos, planejamento e envio de fotografias para uma simulação
        visual por inteligência artificial. Enquanto Supabase e Gemini não
        estiverem configurados, esses tratamentos permanecem desabilitados.
      </p>
      <h2>Fotografias e serviço de IA</h2>
      <p>
        Após a configuração, as fotografias originais e os resultados ficam em
        armazenamento privado e associados à conta da profissional responsável.
        Mediante confirmação de autorização na interface, a fotografia é enviada
        ao provedor de IA configurado para gerar a simulação. A política final
        deverá identificar os operadores, transferências, retenção e descarte.
      </p>
      <h2>Informações técnicas</h2>
      <p>
        O provedor de hospedagem pode processar registros técnicos de acesso.
        Não foram adicionados rastreadores publicitários ou ferramentas de
        análise ao código. A política definitiva deve refletir a configuração de
        produção efetivamente adotada.
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
