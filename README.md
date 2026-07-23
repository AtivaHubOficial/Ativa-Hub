# ATIVA HUB v2.0

Aplicação Next.js + TypeScript + Tailwind preparada para Supabase.

## O que já funciona nesta Sprint

- Loja moderna e responsiva.
- Busca e categorias.
- Página individual de produto.
- Avaliação, número de avaliações, frete grátis, Full e parcelamento.
- Painel administrativo.
- Dashboard executivo.
- Módulo de missões diárias.
- Cadastro e exclusão de produtos.
- Geração de texto para posts.
- Catálogo salvo no navegador enquanto o Supabase não está conectado.
- Estrutura inicial do banco de dados em `supabase/schema.sql`.
- Interface preparada para importação inteligente.

## Importante

A importação automática a partir de uma página do Mercado Livre ainda não está ativada.
Ela exige backend e uma integração autorizada. A interface já está pronta, mas não faz
raspagem de páginas nem simula dados falsos.

O login real, banco em nuvem, métricas de cliques/vendas e publicação automática entram
nas próximas Sprints.

## Rodar no computador

1. Instale Node.js 20 ou superior.
2. Abra o terminal dentro da pasta do projeto.
3. Execute:

```bash
npm install
npm run dev
```

4. Abra `http://localhost:3000`.

## Conectar Supabase

1. Crie um projeto no Supabase.
2. Execute o conteúdo de `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env.local`.
4. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Estrutura

- `/` — loja.
- `/produto/[id]` — página detalhada.
- `/admin` — painel.
- `lib/storage.ts` — persistência local provisória.
- `lib/supabase.ts` — cliente Supabase preparado.
- `supabase/schema.sql` — banco inicial.

## Próxima Sprint

- Login de administrador com Supabase Auth.
- Persistência real no banco.
- Controle de acesso.
- Registro de cliques.
- Dashboard com dados reais.

## Sprint 3.0.4 — autenticação administrativa

As rotas `/admin`, `/admin/produtos` e `/admin/produtos/novo` exigem uma sessão do Supabase Auth e um vínculo em `public.admin_users`. A rota `/admin/login` permanece pública. Usuários autenticados sem autorização são enviados para `/admin/acesso-negado`.

### Configuração e primeiro administrador

1. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`. A chave `service_role` não é usada pela aplicação.
2. Execute `supabase/schema.sql` caso o schema inicial ainda não exista.
3. Execute `supabase/migrations/20260720_sprint_3_0_4_admin_auth.sql` no SQL Editor.
4. Em **Authentication > Users**, crie manualmente o usuário com e-mail e senha.
5. Copie o UUID do usuário e execute no SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('UUID_DO_USUARIO_AQUI')
on conflict (user_id) do nothing;
```

Somente o responsável pelo projeto deve executar esse cadastro pelo painel seguro do Supabase. A aplicação não oferece registro público nem permite que um usuário conceda privilégio administrativo a si mesmo.

### Segurança

- `anon` conserva apenas a leitura de produtos ativos definida no schema inicial.
- `anon` não recebe `INSERT`, `UPDATE` ou `DELETE` em produtos.
- Usuários autenticados só administram produtos quando `public.is_admin()` retorna verdadeiro.
- `public.admin_users` permite ao usuário autenticado consultar apenas o próprio vínculo.
- Middleware e proteção de interface complementam o RLS; não o substituem.

## Sprint 3.0.5 — CRUD de produtos

Execute `supabase/migrations/20260720_sprint_3_0_5_products_crud.sql` depois das migrations anteriores. Ela amplia `products`, cria categorias persistidas, índices e o bucket `product-images`, sempre preservando a autorização por `admin_users`/`is_admin()`.

O Supabase é a fonte principal quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidas. `seedProducts` é somente fallback local quando essas variáveis não existem. O painel permite cadastrar, editar, excluir, filtrar, definir destaque e enviar múltiplas imagens JPEG, PNG ou WebP de até 5 MB.

## Sprint 3.1 — Importador Inteligente

Na tela **Novo produto**, administradores podem colar uma URL HTTPS de anúncio do Mercado Livre Brasil. O backend valida o domínio e o código MLB, consulta a API pública e prepara título, marca, categoria, descrições, preços, imagens e especificações para revisão. A importação nunca salva ou publica automaticamente; categoria, link de afiliado e demais campos devem ser conferidos antes do cadastro.

O importador usa exclusivamente a API oficial do Mercado Livre com OAuth 2.0 Authorization Code, `state`, PKCE, escopo `offline_access read` e renovação automática. Depois de extrair o código MLB da URL completa, consulta `/items/{ITEM_ID}`, `/items/{ITEM_ID}/description` e `/categories/{CATEGORY_ID}`. Não acessa nem processa o HTML público do anúncio.

URLs de oferta no formato `/MLB-1234567890-...` contêm um `ITEM_ID` e são aceitas. URLs de catálogo no formato `/p/MLB12345678` contêm um `product_id`, que pode representar várias ofertas concorrentes, e são rejeitadas com orientação para abrir uma oferta específica. Se uma URL de catálogo trouxer um parâmetro `item_id=MLB...` explícito, esse anúncio específico pode ser importado.

### OAuth do Mercado Livre

Configure somente no ambiente do servidor:

```env
MERCADO_LIVRE_CLIENT_ID=...
MERCADO_LIVRE_CLIENT_SECRET=...
MERCADO_LIVRE_REDIRECT_URI=https://ativa-hub.vercel.app/api/auth/mercado-livre/callback
NEXT_PUBLIC_SITE_URL=https://ativa-hub.vercel.app
```

O administrador inicia a autorização pela tela **Novo produto**, usando **Conectar Mercado Livre**, ou diretamente por `/api/auth/mercado-livre/start`. O callback oficial é `/api/auth/mercado-livre/callback`.

Access token e refresh token ficam em um envelope AES-256-GCM, armazenado em cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`. O navegador nunca recebe os tokens em texto legível. O access token é renovado até cinco minutos antes de expirar e o novo refresh token substitui o anterior. Nenhum token, Client Secret ou corpo da resposta OAuth é registrado em logs.

#### Vercel

1. Em **Project Settings > Environment Variables**, adicione as quatro variáveis acima para Production e Preview conforme necessário.
2. Confirme no painel do Mercado Livre a URI exata `https://ativa-hub.vercel.app/api/auth/mercado-livre/callback`.
3. Faça um novo deploy para disponibilizar as variáveis ao runtime.
4. Entre no Admin Center, abra **Novo produto**, tente importar um anúncio e clique em **Conectar Mercado Livre**.

Não configure Client Secret em variáveis iniciadas por `NEXT_PUBLIC_`.

#### Desenvolvimento local

As credenciais podem ficar em `.env.local`, que não deve ser versionado. Com a URI de produção atualmente cadastrada, a conclusão do OAuth deve ser homologada em `https://ativa-hub.vercel.app`, pois cookies de `localhost` não são enviados ao domínio da Vercel. Para concluir o fluxo inteiramente em localhost, cadastre também no aplicativo do Mercado Livre uma URI local permitida e defina temporariamente:

```env
MERCADO_LIVRE_REDIRECT_URI=http://localhost:3000/api/auth/mercado-livre/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Não foi criada migration e nenhuma alteração foi aplicada ao banco remoto.

## Sprint 3.2 — Conector oficial Logzz

O painel administrativo possui a opção **Importar da Logzz**, que carrega produtos de afiliado, produtor e coprodutor pela API oficial. Cada oferta é selecionada individualmente e sincronizada pela combinação `source + external_product_id + external_offer_id`, sem duplicar produtos.

Configure apenas no servidor:

```env
LOGZZ_API_TOKEN=
LOGZZ_API_BASE_URL=https://app.logzz.com.br/api/v1
```

1. Crie o token no painel da Logzz.
2. Preencha as variáveis em `.env.local` para desenvolvimento.
3. Execute `supabase/migrations/20260723_sprint_3_2_logzz.sql`.
4. Na Vercel, adicione as duas variáveis em **Project Settings > Environment Variables**.
5. Faça um novo deploy.
6. Entre no painel administrativo, abra **Produtos > Importar da Logzz**, carregue o catálogo e selecione as ofertas.

O token nunca usa prefixo `NEXT_PUBLIC_`, não é enviado ao navegador e não é armazenado no Supabase.
