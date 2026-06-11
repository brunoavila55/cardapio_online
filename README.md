# Cardápio Digital (White Label)

Este é um boilerplate para um sistema de Cardápio Digital com painel administrativo integrado. Ele foi construído utilizando React, Vite e Supabase, sendo facilmente configurável para uso em qualquer restaurante, bar ou hotel.

## 🛠️ Stack Tecnológica

### Backend (Próprio)
* **Node.js + Express**: Servidor HTTP robusto.
* **Prisma ORM + PostgreSQL**: Banco de dados relacional e queries seguras com forte suporte a Multitenancy.
* **Autenticação**: JWT e Bcrypt em API própria, com Middleware Global (`requireTenant.js`) isolando dados.
* **Armazenamento**: Envio local via multer e gerenciamento nativo de assets estáticos (sem Supabase).
* **Logging**: Monitoramento com `pino-http`.

### Frontend
* **Vite + React 18**: Alta performance e HMR.
* **TailwindCSS**: Utilitários para o painel Admin.
* **Vanilla CSS**: Estilo rígido Art Déco da área pública.
* **React Query v5**: Gestão otimizada de estado assíncrono.
* **Error Boundaries**: Proteção contra crashes e loading skeletons.

## Como rodar o projeto

O projeto agora foi refatorado e é composto por um servidor backend e a aplicação frontend.

1. **Configuração do Backend:**
Renomeie o `.env.example` dentro da pasta `backend/` para `.env` (ou crie um) e adicione suas credenciais do banco Postgres e JWT:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cardapio?schema=public"
PORT=3000
JWT_SECRET="seu-segredo-super-seguro"
```

2. **Instalar dependências e iniciar o banco:**
No terminal, entre na pasta backend:
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

3. **Configuração do Frontend:**
No terminal da raiz do projeto, instale as dependências e inicie o Vite:
```bash
npm install
npm run dev
```

4. **Testando a aplicação:**
- Para criar o primeiro restaurante e testar, acesse o painel no navegador em `http://localhost:5173/register` ou clique em **Cadastre-se**.

## Configuração White Label

Este projeto é genérico. Para alterar as logomarcas, basta substituir os arquivos `logo.svg` em `public/` ou alterar os componentes de imagem conforme sua necessidade. O nome exibido e os fallbacks podem ser alterados através das variáveis de ambiente.
