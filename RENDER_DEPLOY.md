# Deploy do Chatwoot no Render com Docker

Este projeto já tinha a estrutura oficial do Chatwoot em `docker/Dockerfile`, mas o Render procura `Dockerfile` na raiz por padrão. Foi adicionado um `Dockerfile` na raiz baseado no Dockerfile oficial para o Render detectar, buildar e iniciar a aplicação sem configurar caminho customizado.

## Estrutura verificada

- Dockerfile oficial do Chatwoot: `docker/Dockerfile`
- Compose de produção: `docker-compose.production.yaml`
- Exemplo de ambiente: `.env.example`
- Rails: `Gemfile`, `config.ru`, `config/puma.rb`, `config/database.yml`, `config/environments/production.rb`
- Entrypoints Docker: `docker/entrypoints/rails.sh`, `docker/entrypoints/vite.sh`
- Procfile: `Procfile`

## Serviços necessários no Render

Crie os serviços nesta ordem:

1. PostgreSQL
2. Redis
3. Web Service Docker para o Chatwoot
4. Background Worker Docker para o Sidekiq

## PostgreSQL

Crie um banco PostgreSQL gerenciado no Render.

Depois de criado, copie a `Internal Database URL` ou `External Database URL` e use como `DATABASE_URL` no serviço web e no worker.

## Redis

Crie um Redis gerenciado no Render.

Copie a URL interna do Redis e use como `REDIS_URL` no serviço web e no worker.

## Web Service

Crie um novo Web Service apontando para este repositório.

Configuração:

- Runtime: `Docker`
- Dockerfile: deixe o padrão `Dockerfile`
- Docker Context: raiz do repositório
- Docker Command: deixe vazio para usar o `CMD` do Dockerfile

O container inicia com:

```sh
/app/render-start.sh
```

Esse script usa a variável `PORT` fornecida pelo Render, faz bind em `0.0.0.0` e roda Rails em `production`.

## Variáveis obrigatórias

Configure no Web Service e também no Background Worker:

```env
RAILS_ENV=production
NODE_ENV=production
INSTALLATION_ENV=docker
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=true
DATABASE_URL=<URL do PostgreSQL do Render>
REDIS_URL=<URL do Redis do Render>
FRONTEND_URL=https://seu-servico.onrender.com
CHATWOOT_HOST=seu-servico.onrender.com
SECRET_KEY_BASE=<valor seguro gerado>
```

Para gerar `SECRET_KEY_BASE` localmente:

```sh
bundle exec rails secret
```

Se preferir sem depender do ambiente local Ruby:

```sh
openssl rand -hex 64
```

## Variáveis recomendadas

```env
FORCE_SSL=true
ENABLE_ACCOUNT_SIGNUP=false
ACTIVE_STORAGE_SERVICE=local
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=0
```

Observações:

- `CHATWOOT_HOST` pode ser configurado com o domínio público. O script de start preenche `FRONTEND_URL` a partir de `CHATWOOT_HOST` apenas se `FRONTEND_URL` não estiver definido.
- Mesmo assim, prefira configurar `FRONTEND_URL` explicitamente com `https://`.
- `ACTIVE_STORAGE_SERVICE=local` funciona para um deploy simples, mas arquivos enviados ficam no disco do serviço. Para produção real, configure S3 compatível.
- Use sempre a mesma `SECRET_KEY_BASE`, `DATABASE_URL`, `REDIS_URL` e `FRONTEND_URL` no web e no worker.

## Preparar o banco

Depois que o PostgreSQL e Redis estiverem prontos e as variáveis estiverem configuradas, rode:

```sh
bundle exec rails db:chatwoot_prepare
```

Opções no Render:

- Configure como Pre-Deploy Command do Web Service, se seu plano tiver esse recurso.
- Ou abra um Shell/Job no Render usando a mesma imagem e rode o comando manualmente.

Com Docker Command temporário, também é possível rodar:

```sh
bundle exec rails db:chatwoot_prepare
```

Depois volte o comando do Web Service para vazio, para usar o `CMD` do Dockerfile.

## Background Worker Sidekiq

Crie um Background Worker no Render usando o mesmo repositório e Dockerfile.

Configuração:

- Runtime: `Docker`
- Dockerfile: `Dockerfile`
- Docker Context: raiz do repositório
- Docker Command:

```sh
bundle exec sidekiq -C config/sidekiq.yml
```

Use as mesmas variáveis do Web Service, principalmente `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY_BASE`, `FRONTEND_URL`, `RAILS_ENV` e `NODE_ENV`.

## WhatsApp Cloud API

Depois do Web Service estar acessível pela URL pública:

1. Entre no Chatwoot.
2. Vá em Configurações > Caixas de Entrada.
3. Crie uma inbox do tipo WhatsApp.
4. Escolha WhatsApp Cloud.
5. Informe os dados da Meta:
   - Phone Number ID
   - Business Account ID
   - Access Token
   - Verify Token
6. Na Meta for Developers, configure o webhook usando a URL pública do Render.

O formato de webhook normalmente fica associado à URL pública definida em `FRONTEND_URL`. Garanta que `FRONTEND_URL` esteja exatamente como o domínio público do Render, por exemplo:

```env
FRONTEND_URL=https://seu-servico.onrender.com
```

## Checklist de sucesso

- O Render encontra `Dockerfile` na raiz.
- O build conclui sem depender de `.git`.
- O serviço web inicia com `PORT` do Render.
- Rails escuta em `0.0.0.0`.
- `DATABASE_URL` aponta para PostgreSQL do Render.
- `REDIS_URL` aponta para Redis do Render.
- `db:chatwoot_prepare` foi executado antes do primeiro uso.
- O Background Worker Sidekiq está rodando.
- A URL pública abre o Chatwoot.
