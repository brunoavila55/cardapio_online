# Contexto Técnico e Arquitetura - Cardápio Digital White Label

Este documento fornece um mapeamento detalhado, técnico e arquitetural do projeto **Cardápio Digital White Label**. Ele serve como a única fonte de verdade para desenvolvedores e agentes de IA compreenderem a estrutura de dados, o fluxo de dados, a identidade visual e as regras de negócio implementadas no sistema.

---

## 1. Visão Geral do Projeto e Identidade Visual

O **Cardápio Digital** é um sistema composto por um cardápio digital voltado para os clientes, e por um painel de administração robusto voltado para os administradores gerenciarem pratos, categorias, subcategorias, mídias e materiais promocionais impressos.

### Diretrizes de Design (Art Déco Premium)
A interface pública segue uma estética **Art Déco corporativa e luxuosa** de alta fidelidade:
* **Paleta de Cores Padrão:**
  * Azul Marinho Escuro (`#141D55` / `--navy-dark`): Fundo principal do cabeçalho, rodapé e menus.
  * Azul Marinho Primário (`#1E2A7A` / `--navy`): Borda superior de cartões, títulos e botões principais.
  * Azul Marinho Médio (`#2A3A9E` / `--navy-mid`): Estados de hover de botões e links ativos.
  * Dourado Principal (`#C9A84C` / `--gold`): Ornamentos, divisores, bordas decorativas e destaques ativos.
  * Dourado Claro (`#E8D48B` / `--gold-light`) & Dourado Pálido (`#F5EDD0` / `--gold-pale`).
  * Marfim (`#F5F3EE` / `--ivory`): Textos em fundos escuros e superfícies alternadas.
* **Tipografia:**
  * Fonte Display/Títulos: `'Cormorant Garamond'`, Georgia, serif (elegância clássica).
  * Fonte UI/Textos: `'Josefin Sans'`, sans-serif (legibilidade e toque moderno).
* **Restrição de Arredondamento Zero no Cardápio Público:**
  * Todo elemento visual na página pública (cards de produtos, divisores, botões de categorias) deve ter **obrigatoriamente borda reta** (`border-radius: 0px` via `--radius-menu: 0px`).
* **Painel Admin:**
  * Segue um visual moderno com cantos levemente arredondados (`border-radius: 8px` via `--radius-admin: 8px`) para melhor ergonomia de uso corporativo em telas de computadores.

---

## 2. Pilha de Tecnologia (Tech Stack)

### Core & Frameworks
* **React 18** & **Vite**: Para compilação ágil de SPA (Single Page Application).
* **Tailwind CSS v3**: Utilizado para estilização utilitária do painel administrativo.
* **Vanilla CSS (tokens.css & index.css)**: Usado para definir o sistema de design rígido Art Déco da interface pública.
* **React Router v7**: Controle de rotas client-side (`createBrowserRouter`).

### Estado & Banco de Dados
* **Supabase Client (`@supabase/supabase-js`)**: Integração de banco de dados PostgreSQL e autenticação em tempo real.
* **TanStack React Query v5**: Gerenciamento de estado de servidor, cache, invalidação de queries e sincronização offline-first de dados.
* **React Hook Form & Zod**: Para validação estrita baseada em schemas e controle tipado dos formulários do administrador.

### Ferramentas Auxiliares
* **qrcode.react**: Para renderização de tela e geração da matriz matemática dos QR Codes dinâmicos.
* **Lucide React**: Biblioteca de ícones vetoriais padronizados.
* **Wrangler / Cloudflare Pages**: Plataforma de deploy e hospedagem de alta performance sob CDN global.

---

## 3. Arquitetura do Banco de Dados (PostgreSQL / Supabase)

O banco de dados armazena informações relacionais em duas tabelas centrais integradas com políticas de RLS (Row Level Security):

### Tabela `categories` (Categorias de Menu)
Representa as grandes divisões do cardápio (ex: Bebidas, Carnes, Sobremesas).
* `id` (`UUID`, PK, default: `gen_random_uuid()`): Identificador único da categoria.
* `name` (`TEXT`, NOT NULL): Nome visível para o cliente (ex: "Carta de Vinhos").
* `slug` (`TEXT`, NOT NULL, UNIQUE): Identificador amigável em URL gerado a partir do nome (ex: "carta-de-vinhos").
* `display_order` (`INTEGER`, NOT NULL, default: `0`): Índice de ordenação usado para organizar as abas no menu horizontal e a sequência dos pratos.
* `created_at` (`TIMESTAMPTZ`, default: `now()`): Data de registro.

### Tabela `products` (Produtos / Pratos)
Armazena todos os itens disponíveis para venda.
* `id` (`UUID`, PK, default: `gen_random_uuid()`): Identificador único do prato.
* `category_id` (`UUID`, FK referenciando `categories.id`, ON DELETE SET NULL): Categoria vinculada.
* `name` (`TEXT`, NOT NULL): Nome do prato (ex: "Filé a Parmegiana").
* `price` (`NUMERIC`, NOT NULL): Preço de venda.
* `description` (`TEXT`, default: `''`): Detalhes do preparo ou ingredientes do prato.
* `image_url` (`TEXT`, NULL): Link da imagem hospedada no Supabase Storage.
* `available` (`BOOLEAN`, default: `true`): Flag de disponibilidade (oculta pratos indisponíveis no menu público).
* `subcategory` (`TEXT`, NULL): Nome da subcategoria organizacional do produto dentro daquela categoria (ex: "Cervejas" dentro de "Bebidas").
* `display_order` (`INTEGER`, NOT NULL, default: `0`): Índice utilizado para a ordenação sequencial personalizada de subcategorias e produtos.
* `created_at` (`TIMESTAMPTZ`, default: `now()`): Data de registro.

### Estrutura de 8 Macro-Categorias Consolidadas
O menu digital é estruturado em exatamente 8 macro-categorias, dispostas pela ordem rígida (`display_order`) para garantir uma navegação intuitiva:
1. **Bebidas & Vinhos** (Ordem `1`): Agrupa refrigerantes, águas, sucos, cervejas, coquetéis, doses, uísques, espumantes e a carta de vinhos (importados, nacionais e argentinos).
2. **Entradas & Petiscos** (Ordem `2`): Agrupa pastéis, bolinhos, porções, petiscos e caldos/sopas.
3. **Saladas** (Ordem `3`): Mix de folhas, Salada Ceasar e Salpicão. Exibidos diretamente, sem subcategorias associadas.
4. **Peixes** (Ordem `4`): Pratos principais e grelhados de peixes, divididos em subcategorias explícitas: `Salmão`, `Tilápia` e `Traíra`.
5. **Carnes & Grelhados** (Ordem `5`): Carnes vermelhas, aves/frangos e omeletes.
6. **Massas & Risotos** (Ordem `6`): Massas artesanais e risotos especiais.
7. **Lanches & Pizzas** (Ordem `7`): Lanches completos, torradas, baurus e pizzas.
8. **Sobremesas** (Ordem `8`): Pudim de leite e petit gâteau.

---

## 4. Estrutura do Projeto (Árvore de Diretórios)

```text
c:\cardapio_online
├── dist/                   # Build final de produção otimizado para deploy
├── public/                 # Favicon, imagens estáticas e assets globais (logo.svg)
├── src/
│   ├── components/
│   │   ├── admin/          # Componentes internos exclusivos do Painel Admin
│   │   │   ├── ConfirmDialog.jsx   # Modal de confirmação genérico de exclusão
│   │   │   ├── ImageUpload.jsx     # Dropzone e uploader de fotos para o Supabase Storage
│   │   │   └── ProductForm.jsx     # Formulário Zod/Hook-Form de criação/edição de produtos
│   │   ├── menu/           # Componentes visuais exclusivos do Menu Público
│   │   │   ├── CategoryNav.jsx     # Barra de categorias horizontal com ícones customizados
│   │   │   ├── DecoHeader.jsx      # Cabeçalho Art Déco com o logo principal ampliado (104px)
│   │   │   ├── DecoOrnament.jsx    # Linha divisória e detalhes geométricos dourados
│   │   │   ├── ProductCard.jsx     # Exibição rígida de pratos (borda zero, badge indisponível)
│   │   │   ├── SectionDivider.jsx  # Divisor visual entre subcategorias no menu
│   │   │   └── SubcategoryNav.jsx  # Barra de subcategorias com controle de filtro ativo
│   │   └── shared/         # Componentes compartilhados
│   │       ├── ProtectedRoute.jsx  # Guarda de rotas que exige autenticação
│   │       └── QRCodeDisplay.jsx   # Estúdio de Impressão de QR Code & Mockups
│   ├── hooks/              # Estado e integração do Supabase via React Query
│   │   ├── useAuth.js      # Gerenciamento de login/logout/sessão administrativa
│   │   ├── useCategories.js# Operações CRUD estruturadas para categorias
│   │   └── useProducts.js  # Operações CRUD estruturadas para produtos
│   ├── lib/
│   │   └── supabase.js     # Inicialização e exportação do cliente do Supabase
│   ├── pages/              # Páginas de nível de rota
│   │   ├── Admin.jsx       # Painel de controle administrativo completo (Desktop)
│   │   ├── Login.jsx       # Tela de login sofisticada de acesso restrito
│   │   └── Menu.jsx        # Página de exibição do cardápio público dos hóspedes
│   ├── styles/
│   │   └── tokens.css      # Variáveis e propriedades CSS globais do tema Art Déco
│   ├── App.jsx             # Definição e inicialização do React Router v7
│   ├── index.css           # Ponto de entrada Tailwind e estilos básicos globais
│   └── main.jsx            # Arquivo de inicialização e montagem no DOM
├── tailwind.config.js      # Customização e tokens de mapeamento do Tailwind
├── vite.config.js          # Configuração de bundler e plugins do Vite
├── wrangler.jsonc          # Arquivo de configuração de deploy do Cloudflare Pages
└── context.md              # Este guia de contexto técnico
```

---

## 5. Algoritmos e Fluxos de Lógica Críticos

### A. Reordenação de Subcategorias Sem Nova Tabela
Como as subcategorias são armazenadas implicitamente no campo `subcategory` dos produtos, a reordenação das subcategorias é gerenciada em lote:
1. Quando o administrador move uma subcategoria para cima ou para baixo no painel admin, a aplicação calcula novos valores de `display_order` para todos os produtos pertencentes àquela subcategoria.
2. É disparada uma transação única de lote `supabase.upsert` contendo todos os produtos carregados daquela categoria modificada.
3. Para respeitar as constraints do banco de dados (que exige campos obrigatórios como `name` e `price` no upsert), o payload é gerado desestruturando o produto original completo `{ ...p, display_order: novoValor }`.
4. No front-end do hóspede (`Menu.jsx`), a ordenação secundária das abas (`activeSubcategories`) e o agrupamento são calculados dinamicamente em tempo real usando o valor mínimo de `display_order` dos produtos dentro de cada subcategoria.

### B. Reordenação Sem Colisão de Categorias Principais
Para evitar a inserção manual de números que causem duplicidades de ordem no banco de dados, o painel administrativo adota um controle de cliques sequenciais:
1. Na lista de categorias, setas de ordenação `▲` e `▼` disparam uma rotina que reordena a lista localmente.
2. A rotina varre a lista reordenada e reatribui ordens sequenciais puras (`1, 2, 3...`).
3. Dispara uma atualização em lote rápida gravando a ordem definitiva, eliminando duplicidades e colisões numéricas.

### C. Geração e Pré-carregamento Assíncrono do QR Code (Estúdio)
Para contornar o bloqueio de segurança que navegadores modernos impõem a downloads que ocorrem após atrasos assíncronos (como esperar um `canvas.toDataURL()` ou carregar imagens dinamicamente ao clicar), o sistema adota um padrão de **Pré-geração em Estado**:
1. Assim que a aba do QR Code é montada no DOM, o componente monta de forma assíncrona um Canvas oculto (`hidden-qr-canvas`) em alta resolução.
2. Uma rotina gera o preview e a arte de cada um dos 3 modelos (QR Code Puro, Suporte de Mesa e Placa de Parede).
3. A imagem do Canvas é convertida em um Blob assíncrono em segundo plano e salva no estado da aplicação como um Object URL (`URL.createObjectURL(blob)`).
4. Quando o usuário clica no botão "Baixar", o download ocorre de forma **100% síncrona**, eliminando qualquer atraso e impedindo o bloqueio de popups de segurança do navegador.

### D. Centralização Inteligente de Barras de Navegação (Desktop)
Para prover uma ótima experiência móvel sem descaracterizar a exibição em monitores de computadores desktop, aplicamos uma lógica de alinhamento condicional baseada em CSS:
* Em telas móveis, as abas de categorias e subcategorias ocupam `width: 100%`, têm comportamento `flex-start` e ativam o scroll horizontal suave sem barras visíveis.
* Graças a uma Media Query aplicada diretamente nas classes de scroll, a partir de `768px` (telas Desktop), o contêiner flexível ganha automaticamente a propriedade `justify-content: center`. Isso garante abas centralizadas no meio da tela no PC, sem esticar os botões de forma inadequada.

---

## 6. Diretrizes e Regras de Desenvolvimento Futuro

1. **Preservar a Identidade Art Déco do Hóspede:**
   * Qualquer botão, contêiner de menu, imagem ou cartão exibido na página pública `/` **não deve possuir bordas arredondadas**. Use sempre `rounded-none` ou propriedades CSS nativas de `border-radius: 0px`.
2. **Cores Coerentes:**
   * Nunca utilize cores genéricas do Tailwind (como `bg-blue-600` ou `bg-red-500`) na interface principal. Utilize estritamente a paleta de variáveis definida no arquivo `tokens.css` (`var(--navy)`, `var(--gold)`, `var(--ivory)`).
3. **Deploy de Segurança no Windows PowerShell:**
   * Devido às políticas restritivas padrão de execução de scripts `.ps1` no PowerShell do Windows, evite executar o comando `npm run deploy` de forma isolada se receber erros de segurança. 
   * A forma definitiva e livre de restrições de rodar comandos de deploy no terminal do Windows é forçar o uso do interpretador de comandos em lote do Windows:
     ```powershell
     npm.cmd run deploy
     ```
4. **Preservação de RLS e Integridade:**
   * Qualquer exclusão em lote ou alteração estrutural no Supabase deve passar pelas camadas normais de mutação das API hooks de forma a invalidar as queries do TanStack Query no sucesso, garantindo reatividade instantânea no painel administrativo e no cardápio público dos clientes.
