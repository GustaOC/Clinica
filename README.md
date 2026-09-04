# Lumina — sistema de simulação estética

Sistema web privado em Next.js para a profissional criar um planejamento e gerar uma simulação por IA para cada fotografia enviada. Não há procedimentos, produtos, profissionais ou fotografias demonstrativos: o catálogo começa vazio e recebe somente dados reais da clínica.

## O que já está implementado

- envio de múltiplas fotos JPG, PNG ou WebP, com normalização no navegador e no servidor;
- planejamento guiado por procedimento, produto, regiões e parâmetros visuais específicos, além das perguntas próprias do catálogo;
- uma chamada Gemini independente por foto, fila pausável e nova tentativa individual;
- comparação antes/depois e exportação com a marca “SIMULAÇÃO IA · RESULTADO ILUSTRATIVO” gravada na imagem;
- histórico por conta, plano imutável e armazenamento privado no Supabase;
- login apenas para usuários previamente habilitados, papéis `admin` e `doctor` e políticas RLS;
- nenhuma chave de Supabase ou Gemini é enviada ao navegador.

A simulação é uma visualização aproximada, não um diagnóstico, prescrição ou promessa de resultado. Os avisos jurídicos em `/privacidade` e `/termos` são provisórios e precisam de revisão antes do uso com dados reais.

## Executar localmente

Requer Node.js 24 e npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Sem as variáveis, a interface abre normalmente em estado de configuração e não aceita login, upload remoto ou geração.

## 1. Criar e preparar o Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute todo o arquivo `supabase/migrations/202609030001_aesthetic_simulations.sql` uma única vez.
3. Em Authentication > Users, crie a conta `admin@clinica.com.br` com uma senha inicial forte. A senha não deve ser colocada no código.
4. No SQL Editor, execute o arquivo `supabase/bootstrap-admin.sql`. Ele encontra essa conta pelo e-mail e libera o papel `admin`.

Para outra profissional, crie o usuário e adicione seu UUID com o papel `doctor`. Uma conta de Authentication sem linha ativa em `aesthetic_members` não acessa o sistema. O aplicativo utiliza apenas e-mail e senha e não habilita login pelo Google.

5. Em Project Settings > API, copie a Project URL e a chave publishable. Se o projeto ainda mostrar somente a chave `anon`, ela também é aceita pelo código via `SUPABASE_ANON_KEY`, mas a variável recomendada é `SUPABASE_PUBLISHABLE_KEY`.

Não use nem configure a chave `service_role`: todas as consultas e arquivos passam pela conta autenticada e pelas políticas RLS. O bucket `aesthetic-photos` é criado como privado pela migração.

## 2. Configurar o Gemini

1. Crie a chave de servidor no Google AI Studio e confirme que a conta tem acesso a um modelo compatível com geração/edição de imagem.
2. Configure `GEMINI_API_KEY` somente no servidor.
3. O padrão do projeto é `gemini-3-pro-image` (Nano Banana Pro), escolhido para edição profissional, instruções complexas e maior fidelidade. A geração solicita raciocínio alto, saída exclusivamente em imagem e resolução 2K. Se a sua conta exigir outro modelo compatível, defina `GEMINI_IMAGE_MODEL` com o identificador exato.

Cada foto consome uma solicitação independente. O sistema não refaz automaticamente chamadas recusadas ou limitadas, para evitar cobrança duplicada. Uma tentativa manual é sempre explícita.

## 3. Configurar na Vercel

Use:

- Application Preset: **Next.js**;
- Root Directory: `./`;
- Build Command: `npm run build`;
- Output Directory: automático (deixe vazio);
- Node.js: **24.x**.

Cadastre `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY` e, somente se necessário, `GEMINI_IMAGE_MODEL` em Settings > Environment Variables. Aplique ao ambiente Production e faça um novo deploy.

## Primeiro acesso

1. Abra o sistema, clique em **Entrar** e use a conta administradora criada no Supabase.
2. Em **Catálogo**, cadastre um procedimento e suas regiões/perguntas.
3. Cadastre os produtos vinculados a esse procedimento.
4. Volte a **Simulações**, selecione as fotos, faça o planejamento e confirme que possui autorização para enviá-las ao serviço de IA.

## Verificação do projeto

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Com o servidor local em execução, o smoke test pode ser reproduzido com:

```sh
node tests/http-smoke.mjs
```

Os testes locais usam somente fixtures sintéticas e respostas Gemini simuladas; não enviam imagens nem consomem cota. A integração ao vivo só pode ser validada após a criação das contas e configuração das chaves.

## Privacidade e operação

- O navegador comprime a foto para até 2,5 MB; o servidor decodifica, remove metadados e grava JPEG no bucket privado.
- Originais e resultados ficam sob o UUID da conta responsável. Outra conta habilitada não lê essas sessões ou arquivos.
- Cookies de sessão são `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- A migração limita cada conta a duas gerações simultâneas e usa uma reivindicação atômica por foto para impedir duplo clique/cobrança duplicada.
- Defina com a assessoria da clínica prazos de retenção, descarte, base legal, consentimento/autorização, operadores e transferências antes de processar fotografias reais.
