#!/bin/sh

CONFIG=$(jo -n \
  backendUrl="${BACKEND_URL:-}" \
  sentryDsn="${SENTRY_DSN:-}" \
  sentryEnv="${SENTRY_ENV:-}")

sed -i "s|/\*__CONFIG__\*/|window.__CONFIG__=$CONFIG|" /usr/share/nginx/html/index.html
exec "$@"
