# Cardápio Digital (White Label)

Este é um boilerplate para um sistema de Cardápio Digital com painel administrativo integrado. Ele foi construído utilizando React, Vite e Supabase, sendo facilmente configurável para uso em qualquer restaurante, bar ou hotel.

## Tecnologias

- **Frontend:** React 18, Vite, Tailwind CSS (para admin), Vanilla CSS (para UI pública)
- **Backend/Database:** Supabase (PostgreSQL)
- **State Management:** TanStack React Query v5
- **Deploy:** Configurado para Cloudflare Pages

## Como rodar o projeto

1. Renomeie `.env.example` para `.env` (ou crie um) e adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_RESTAURANT_NAME="Nome do Seu Restaurante"
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o script de seeder para popular o banco de dados (certifique-se de que o Supabase está configurado com RLS correto ou use a Service Role Key provisoriamente):
```bash
node seeder.js
```
*(As credenciais padrão de admin geradas serão admin@admin.com / admin123)*

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Configuração White Label

Este projeto é genérico. Para alterar as logomarcas, basta substituir os arquivos `logo.svg` em `public/` ou alterar os componentes de imagem conforme sua necessidade. O nome exibido e os fallbacks podem ser alterados através das variáveis de ambiente.
