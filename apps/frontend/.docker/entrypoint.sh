#!/bin/sh

CONFIG=$(jo -n \
  apiUrl="${API_URL:-}" \
  sentryDsn="${SENTRY_DSN:-}" \
  sentryEnv="${SENTRY_ENV:-}")

sed -i "s|/\*__CONFIG__\*/|window.__CONFIG__=$CONFIG|" /usr/share/nginx/html/index.html
exec "$@"
