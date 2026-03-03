# Sistema SupPaciente - Arquitetura Separada

Este projeto foi refatorado para separar completamente o frontend e backend, permitindo deploy independente em diferentes plataformas.

## 📁 Estrutura do Projeto

```
attendance-system/
├── client/                 # Frontend React + Vite (deploy em Vercel)
│   ├── package.json       # Dependências do frontend
│   ├── vite.config.ts     # Configuração Vite
│   ├── tsconfig.json      # TypeScript config
│   ├── src/               # Código-fonte React
│   ├── public/            # Arquivos estáticos
│   └── ENV_EXAMPLE.txt    # Variáveis de ambiente
│
├── server/                # Backend Express + Node (deploy em Node externo)
│   ├── package.json       # Dependências do backend
│   ├── index.ts           # Entrada principal do servidor
│   ├── routers.ts         # Rotas tRPC
│   ├── db.ts              # Funções de banco de dados
│   ├── _core/             # Código core (auth, context, etc)
│   └── ENV_EXAMPLE.txt    # Variáveis de ambiente
│
├── drizzle/               # Schema e migrações do banco (compartilhado)
├── shared/                # Código compartilhado (tipos, constantes)
└── README.md              # Este arquivo
```

## 🚀 Desenvolvimento Local

### Pré-requisitos
- Node.js >= 18.0.0
- pnpm ou npm
- MySQL 8.0+

### 1. Instalar Dependências

**Frontend:**
```bash
cd client
pnpm install
```

**Backend:**
```bash
cd server
pnpm install
```

### 2. Configurar Variáveis de Ambiente

**Backend (.env):**
```bash
cp server/ENV_EXAMPLE.txt server/.env
# Editar server/.env com suas configurações
```

**Frontend (.env.local):**
```bash
cp client/ENV_EXAMPLE.txt client/.env.local
# Editar client/.env.local com suas configurações
```

### 3. Executar Migrações do Banco

```bash
cd server
pnpm db:push
```

### 4. Iniciar Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
# Servidor rodando em http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd client
pnpm dev
# Frontend rodando em http://localhost:5173
```

## 🔧 Build e Deploy

### Frontend - Vercel

1. **Build Local:**
```bash
cd client
pnpm build
# Gera dist/ com arquivos estáticos
```

2. **Deploy no Vercel:**
```bash
# Opção 1: Via CLI
vercel deploy

# Opção 2: Conectar repositório GitHub no Vercel
# - Apontar root directory: client
# - Build command: pnpm build
# - Output directory: dist
```

3. **Variáveis de Ambiente no Vercel:**
- `VITE_API_URL`: URL do backend (ex: https://seu-backend.com)

### Backend - Node Externo (Railway, Render, Heroku, etc)

1. **Build:**
```bash
cd server
pnpm build
# Gera dist/index.js
```

2. **Deploy no Railway/Render:**

**Railway:**
```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Render:**
- Conectar repositório GitHub
- Criar novo Web Service
- Build command: `cd server && pnpm install && pnpm build`
- Start command: `node dist/index.js`
- Adicionar variáveis de ambiente

3. **Variáveis de Ambiente no Backend:**
```
DATABASE_URL=mysql://user:pass@host/db
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://seu-frontend.vercel.app
JWT_SECRET=sua-chave-secreta
```

## 📡 Comunicação Frontend-Backend

### Configuração de API

O frontend se conecta ao backend via tRPC usando a variável `VITE_API_URL`:

**Desenvolvimento:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- `VITE_API_URL=http://localhost:3001`

**Produção:**
- Frontend: `https://seu-app.vercel.app`
- Backend: `https://seu-backend.com`
- `VITE_API_URL=https://seu-backend.com`

### CORS

O backend está configurado para aceitar requisições de múltiplas origens via `CORS_ORIGIN`:

```
CORS_ORIGIN=http://localhost:5173,https://seu-frontend.vercel.app
```

## 🗄️ Banco de Dados

### Schema Compartilhado

O schema do banco está em `drizzle/schema.ts` e é compartilhado entre frontend e backend.

### Migrações

```bash
# Gerar nova migração após alterar schema
cd server
pnpm db:push

# Ver histórico de migrações
ls drizzle/migrations/
```

## 🧪 Testes

```bash
# Backend
cd server
pnpm test

# Frontend (quando configurado)
cd client
pnpm test
```

## 📝 Scripts Disponíveis

### Frontend
- `pnpm dev` - Iniciar servidor de desenvolvimento
- `pnpm build` - Build para produção
- `pnpm preview` - Preview do build
- `pnpm check` - Verificar tipos TypeScript

### Backend
- `pnpm dev` - Iniciar servidor de desenvolvimento
- `pnpm build` - Build para produção
- `pnpm start` - Executar build em produção
- `pnpm check` - Verificar tipos TypeScript
- `pnpm db:push` - Executar migrações

## 🔐 Segurança

- Nunca commitar arquivos `.env`
- Usar variáveis de ambiente para secrets
- CORS está configurado para aceitar apenas origens autorizadas
- Cookies são enviados com `credentials: include`

## 📚 Documentação

- [Guia do Operador](../guia-operador.pdf)
- [Guia do Monitor](../guia-monitor.pdf)
- [Slides - Guia do Monitor](../guia-monitor-slides/)

## 🆘 Troubleshooting

### Erro de CORS
- Verificar `CORS_ORIGIN` no backend
- Verificar `VITE_API_URL` no frontend
- Certificar que o backend está rodando

### Erro de Banco de Dados
- Verificar `DATABASE_URL`
- Certificar que MySQL está rodando
- Executar `pnpm db:push`

### Erro de Conexão
- Verificar se backend está rodando em `http://localhost:3001`
- Verificar logs do backend
- Verificar console do navegador (F12)

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou os guias fornecidos.


## 🔄 Migração de MySQL para PostgreSQL (Supabase)

O projeto foi migrado de MySQL para PostgreSQL para suportar deploy na Vercel. Aqui estão os detalhes:

### Alterações Realizadas

1. **Schema do Banco**: `drizzle/schema.ts`
   - Alterado de `mysql-core` para `pg-core`
   - Tipos atualizados: `int` → `serial`, `mysqlEnum` → `pgEnum`, `mysqlTable` → `pgTable`
   - Timestamps agora com `withTimezone: true`

2. **Driver do Banco**: `server/db.ts`
   - Alterado de `mysql2` para `postgres-js`
   - Função `onDuplicateKeyUpdate` → `onConflictDoUpdate`
   - Inserções agora usam `.returning()` em vez de `.insertId`

3. **Configuração Drizzle**: `drizzle.config.ts`
   - Dialect alterado de `mysql` para `postgresql`

4. **Dependências**:
   - Removido: `mysql2`
   - Adicionado: `postgres` (postgres-js driver)
   - Adicionado: `pg` (para drizzle-kit migrations)

### Configurar Supabase

1. **Criar projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Crie novo projeto
   - Copie a connection string

2. **Atualizar `.env`**:
   ```
   DATABASE_URL=postgresql://postgres:password@db.host.supabase.co:5432/postgres?sslmode=require
   ```

3. **Executar migrações**:
   ```bash
   cd /home/ubuntu/attendance-system
   pnpm db:push
   ```

### Deploy na Vercel

O projeto está pronto para deploy:

1. **Backend** (Node externo):
   - Usar Railway, Render ou Heroku
   - Adicionar `DATABASE_URL` com Supabase
   - Seguir instruções em `DEPLOYMENT.md`

2. **Frontend** (Vercel):
   - Conectar repositório GitHub
   - Root directory: `client`
   - Build command: `pnpm build`
   - Adicionar `VITE_API_URL` apontando para backend

### Notas Importantes

- SSL é obrigatório: `?sslmode=require`
- Supabase fornece SSL automático
- Conexão pooling é gerenciada pelo `postgres-js`
- Migrações estão em `drizzle/migrations/`
