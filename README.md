# Lumina — site institucional

Next.js App Router + React + TypeScript, preparado para Vercel. Design Clean Health em azul-marinho `#1A365D`, azul `#2B6CB0`, branco e cinza-gelo. Fontes Inter e Lora hospedadas localmente, sem requisições ao Google Fonts.

## Executar

Use Node.js 24 e npm:

```sh
npm ci
npm run dev
```

Validação e produção:

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

### Validação desta entrega

Os 7 testes automatizados de contatos e bloqueio da API passaram. A verificação de sintaxe dos arquivos e `git diff --check` também passaram.

**A compilação de produção foi validada em 03/09/2026.** Após concluir a instalação, foram corrigidos os imports das fontes para as entradas padrão de `@fontsource-variable/inter` e `@fontsource-variable/lora`: esses pacotes não contêm `latin.css`. O comando `npm run build` passou, incluindo TypeScript e geração das páginas. A validação local usou Node.js 26.7.0; a configuração de destino na Vercel continua Node.js 24.x. Não houve teste de navegador ou medição de performance.

Para reproduzir, execute a sequência acima com Node.js 24. O lint completo também encontrou avisos/erros preexistentes em componentes genéricos de `components/ui` e `hooks/use-mobile.ts`, fora do redesign; não foram mascarados nem removidos.

Para conferir as respostas HTTP após subir `npm start`, execute em outro terminal:

```sh
node tests/http-smoke.mjs
```

Esse teste passou contra o servidor de produção local: as quatro páginas públicas retornaram HTTP 200, e GET/POST da API clínica continuaram retornando HTTP 503 sem acesso a prontuários.

## Publicar na Vercel

1. Envie este projeto para um repositório seu e importe-o na Vercel.
2. Selecione o preset **Next.js**, raiz do projeto `.`, Node.js **24.x**.
3. Use `npm run build` como comando de build. Mantenha o diretório de saída automático do Next.js; não use `dist`.
4. Preencha as variáveis da `.env.example` nas configurações da Vercel. Nenhuma chave OpenAI, cookie ChatGPT, binding Cloudflare ou conta Sites é necessária.
5. Configure `SITE_URL` com o domínio oficial (incluindo `https://`). Na ausência dele, o projeto usa `VERCEL_PROJECT_PRODUCTION_URL` quando fornecido pela Vercel. Sem origem conhecida, omite imagens OG absolutas.
6. Refaça o deploy após atualizar variáveis ou conteúdo: o site institucional é pré-renderizado no build.

O deploy anterior no domínio `chatgpt.site` **não é atualizado, removido ou migrado automaticamente** por esta alteração. Esta entrega prepara o código para a Vercel; não publica na sua conta.

## Conteúdo oficial — sem dados fictícios

Os dados públicos ficam em `content/clinic.ts` e nas variáveis de ambiente. Por solicitação do proprietário, especialidades, profissionais, CRM, RQE, fotos, convênios, endereço, telefone, horários, razão social, CNPJ e RT não recebem valores inventados.

- Enquanto faltarem contatos válidos, agendamento abre um aviso explicando a indisponibilidade. Não há envio, armazenamento ou confirmação de consulta fictícia.
- Com `CLINIC_WHATSAPP` válido, o botão abre uma mensagem genérica para a clínica; confirmação e disponibilidade dependem da equipe. Telefone e e-mail oficiais também podem ser usados.
- Não se coleta nome, CPF, sintomas, fotos ou qualquer outro dado de paciente no site público.
- Fotos reais/autorizadas devem ser colocadas em `public/images/`. Preencha os campos `photo` com caminho `/images/...`, texto alternativo e dimensões reais. Prefira arquivos WebP. Não use fotos de banco ou geradas como se fossem da clínica.
- Em `professionals`, só publique nomes e títulos com CRM/UF, RQE quando aplicável e currículo verificados. Os cartões sem cadastro são espaços reservados, não profissionais fictícios.
- Cadastre somente convênios confirmados. Não há logos ou contratos presumidos.
- As páginas de privacidade e termos são **avisos provisórios**, não textos jurídicos aprovados. Exigem revisão da clínica/jurídico antes do lançamento.
- A indexação está desligada (`robots: noindex, nofollow` no layout) enquanto o conteúdo oficial estiver pendente. Só habilite depois da validação.

## Segurança e migração da área clínica

A tela pública deixou de exigir login do ChatGPT. Foram removidos o runtime Vinext, plugins Sites/Cloudflare, configuração de hospedagem Sites, helper de autenticação e acesso D1 do runtime.

Isso **não** transforma o sistema de prontuários em um serviço público. O protótipo anterior foi preservado em `legacy/clinic-app.tsx`, fora das rotas e da compilação de produção. Contém dados demonstrativos e ações incompletas; não deve ser usado para atendimento real.

O endpoint `/api/patients` retorna **503, sem leitura ou gravação**, inclusive para requisições que tragam os antigos cabeçalhos de identidade. Ele não processa o corpo da requisição. A área `/portal` explica que o acesso clínico ainda não foi configurado e não apresenta prontuários.

`db/schema.ts` e `drizzle/` foram preservados como referência de modelagem. As tabelas e os arquivos existentes na hospedagem anterior não são migrados, exportados nem apagados. Antes de reativar o painel, é necessário escolher e implementar autenticação própria, autorização por perfil, novo banco e armazenamento privado compatíveis com a Vercel, migração validada e revisão de segurança. A integração Gemini não fazia parte de um serviço real implementado e continua não conectada.

## Performance e acessibilidade

- Página pré-renderizada; ilhas client-side somente para menu, agendamento, currículos e perguntas frequentes.
- Fontes locais com `font-display: swap`.
- `next/image`: WebP, tamanhos responsivos, dimensões reservadas, preload apenas para a foto principal e lazy loading abaixo da primeira dobra.
- Alvos de toque de pelo menos 48px, foco visível, navegação por teclado, diálogos acessíveis e redução de movimento.
- O alvo de LCP < 2,5s depende de fotos, dispositivos, conexão e hospedagem. Não é garantido pelo build; medir com PageSpeed Insights/Lighthouse na Vercel com o conteúdo real.

Documentação oficial: [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [otimização de imagens](https://nextjs.org/docs/app/api-reference/components/image).
