# Guia de Deploy - Sistema SupPaciente

Este documento fornece instruções passo a passo para fazer deploy do frontend e backend em ambientes de produção.

## 🎯 Visão Geral

- **Frontend**: Deploy em Vercel (recomendado) ou qualquer host estático
- **Backend**: Deploy em Railway, Render, Heroku, ou qualquer host Node.js
- **Banco de Dados**: MySQL hospedado em nuvem (AWS RDS, PlanetScale, etc)

## 📋 Pré-requisitos

1. Repositório GitHub do projeto
2. Conta Vercel (para frontend)
3. Conta Railway/Render (para backend)
4. Banco de dados MySQL em produção

## 🚀 Deploy Frontend (Vercel)

### Opção 1: Vercel CLI

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Navegar para pasta do frontend
cd client

# 4. Deploy
vercel deploy --prod
```

### Opção 2: GitHub Integration (Recomendado)

1. **Push do código para GitHub:**
```bash
git add .
git commit -m "Separate frontend and backend"
git push origin main
```

2. **No Vercel Dashboard:**
   - Clique em "New Project"
   - Selecione seu repositório GitHub
   - Configure:
     - **Root Directory**: `client`
     - **Build Command**: `pnpm build`
     - **Output Directory**: `dist`
   - Adicione variáveis de ambiente:
     - `VITE_API_URL`: `https://seu-backend.com`

3. **Deploy automático:**
   - Cada push para `main` fará deploy automático

### Variáveis de Ambiente - Frontend

```
VITE_API_URL=https://seu-backend.com
VITE_APP_TITLE=Sistema SupPaciente
VITE_APP_LOGO=/logo.svg
```

## 🔧 Deploy Backend (Railway)

### Passo 1: Preparar Repositório

```bash
# Certificar que o código está no GitHub
git push origin main
```

### Passo 2: Railway Setup

1. **Criar conta em railway.app**
2. **Conectar GitHub**
3. **Criar novo projeto:**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Selecione seu repositório

### Passo 3: Configurar Build

No Railway Dashboard:

1. **Settings → Build:**
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`

2. **Environment:**
   - Adicione variáveis:
     ```
     NODE_ENV=production
     PORT=3001
     DATABASE_URL=mysql://user:pass@host:3306/db
     CORS_ORIGIN=https://seu-frontend.vercel.app
     JWT_SECRET=sua-chave-secreta-aleatória
     ```

### Passo 4: Deploy

- Railway fará deploy automaticamente
- URL do backend: `https://seu-railway-app.up.railway.app`

## 🔧 Deploy Backend (Render)

### Passo 1: Preparar Repositório

```bash
git push origin main
```

### Passo 2: Render Setup

1. **Criar conta em render.com**
2. **Conectar GitHub**
3. **Criar novo Web Service:**
   - Clique em "New +"
   - Selecione "Web Service"
   - Selecione seu repositório

### Passo 3: Configurar Build

1. **Name**: `attendance-system-backend`
2. **Environment**: `Node`
3. **Build Command**: `cd server && pnpm install && pnpm build`
4. **Start Command**: `node /opt/render/project/src/server/dist/index.js`
5. **Plan**: `Free` ou `Paid` (conforme necessário)

### Passo 4: Variáveis de Ambiente

Adicione no Render:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://user:pass@host:3306/db
CORS_ORIGIN=https://seu-frontend.vercel.app
JWT_SECRET=sua-chave-secreta-aleatória
```

### Passo 5: Deploy

- Clique em "Create Web Service"
- Render fará deploy automaticamente

## 🗄️ Setup do Banco de Dados

### Opção 1: AWS RDS

1. **Criar instância MySQL:**
   - Engine: MySQL 8.0
   - DB instance class: db.t3.micro (free tier)
   - Storage: 20 GB
   - Publicly accessible: Yes

2. **Obter connection string:**
   ```
   DATABASE_URL=mysql://admin:password@seu-rds-endpoint.rds.amazonaws.com:3306/attendance_system
   ```

### Opção 2: PlanetScale

1. **Criar conta em planetscale.com**
2. **Criar novo database**
3. **Obter connection string**
4. **Usar em `DATABASE_URL`**

### Executar Migrações

```bash
# Localmente com acesso ao banco
cd server
DATABASE_URL=mysql://... pnpm db:push
```

## 🔗 Conectar Frontend e Backend

### Atualizar CORS no Backend

Após fazer deploy do frontend, atualizar `CORS_ORIGIN`:

**Railway/Render:**
- Ir para Settings
- Editar `CORS_ORIGIN`
- Adicionar URL do Vercel: `https://seu-app.vercel.app`

### Atualizar API URL no Frontend

**Vercel:**
- Ir para Settings → Environment Variables
- Editar `VITE_API_URL`
- Adicionar URL do backend: `https://seu-backend.railway.app`

## ✅ Verificação de Deploy

### Testar Backend

```bash
# Health check
curl https://seu-backend.railway.app/health

# Deve retornar:
# {"status":"ok","timestamp":"2024-02-16T..."}
```

### Testar Frontend

1. Abrir `https://seu-app.vercel.app`
2. Fazer login
3. Criar um caso
4. Verificar se funciona

## 🔐 Segurança em Produção

### Secrets Importantes

```
JWT_SECRET=gerar-chave-aleatória-segura
CORS_ORIGIN=https://seu-frontend.vercel.app
DATABASE_URL=mysql://user:pass@host/db
```

### Gerar JWT Secret Seguro

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Bash
openssl rand -hex 32
```

### SSL/HTTPS

- Vercel: Automático
- Railway/Render: Automático
- Certificado: Let's Encrypt (automático)

## 📊 Monitoramento

### Railway

- Dashboard → Logs
- Monitorar CPU, memória, requisições

### Render

- Dashboard → Logs
- Monitorar status e erros

### Vercel

- Analytics → Overview
- Monitorar performance e erros

## 🆘 Troubleshooting

### Erro: "Cannot find module 'cors'"

**Solução:**
```bash
cd server
pnpm install
pnpm build
```

### Erro: "CORS error"

**Verificar:**
1. `CORS_ORIGIN` no backend
2. `VITE_API_URL` no frontend
3. URLs exatas (sem barra final)

### Erro: "Database connection failed"

**Verificar:**
1. `DATABASE_URL` correto
2. Banco de dados está rodando
3. Firewall permite conexão
4. Credenciais corretas

### Erro: "Cannot GET /api/trpc"

**Verificar:**
1. Backend está rodando
2. `VITE_API_URL` está correto
3. Rota `/api/trpc` existe

## 📞 Suporte

Para dúvidas, consulte:
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Railway](https://docs.railway.app)
- [Documentação Render](https://render.com/docs)
- [Documentação tRPC](https://trpc.io/docs)
