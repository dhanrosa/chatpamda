#!/bin/sh
set -e

export RAILS_ENV="${RAILS_ENV:-production}"
export NODE_ENV="${NODE_ENV:-production}"
export INSTALLATION_ENV="${INSTALLATION_ENV:-docker}"
export RAILS_LOG_TO_STDOUT="${RAILS_LOG_TO_STDOUT:-true}"
export RAILS_SERVE_STATIC_FILES="${RAILS_SERVE_STATIC_FILES:-true}"
export PORT="${PORT:-3000}"

if [ -z "${FRONTEND_URL:-}" ] && [ -n "${CHATWOOT_HOST:-}" ]; then
  case "$CHATWOOT_HOST" in
    http://*|https://*) export FRONTEND_URL="$CHATWOOT_HOST" ;;
    *) export FRONTEND_URL="https://$CHATWOOT_HOST" ;;
  esac
fi

rm -f /app/tmp/pids/server.pid

bundle exec rails ip_lookup:setup
exec bundle exec rails server -b 0.0.0.0 -p "$PORT" -e "$RAILS_ENV"
