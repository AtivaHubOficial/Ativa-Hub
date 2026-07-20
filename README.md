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
