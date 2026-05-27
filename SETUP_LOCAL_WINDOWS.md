# Setup local no Windows com Docker

Este projeto foi baixado como ZIP/copia, sem pasta `.git`. Para rodar localmente no Windows, use o `docker-compose.production.yaml`, que usa a imagem oficial `chatwoot/chatwoot:latest` e evita build local.

## Pre-requisitos

1. Instale o Docker Desktop para Windows.
2. Ative o backend WSL2 no Docker Desktop.
3. Abra o VS Code ou PowerShell na pasta do projeto.

## Rodar o Chatwoot

Baixe as imagens:

```powershell
npm run dev:pull
```

Prepare o banco de dados:

```powershell
npm run dev:prepare
```

Suba os servicos:

```powershell
npm run dev
```

Abra no navegador:

```text
http://localhost:3000
```

## Logs

Para acompanhar os logs:

```powershell
npm run dev:logs
```

## Parar

Para parar os containers:

```powershell
npm run dev:down
```

## Arquivos usados

- `.env`: variaveis locais minimas para Docker.
- `docker-compose.production.yaml`: Rails, Sidekiq, Postgres, Redis e storage local.
- `package.json`: scripts `npm run dev:*` para facilitar o uso no Windows.
