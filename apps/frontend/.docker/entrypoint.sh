#!/bin/sh

ALLOWED_VARS=$(cat /tmp/allowed_vars)

for file in /usr/share/nginx/html/assets/*.js; do
  envsubst "$ALLOWED_VARS" < "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
done

exec "$@"
