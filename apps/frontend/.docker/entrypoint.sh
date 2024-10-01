#!/bin/sh

ALLOWED_VARS=$(grep -v '^#' .env.production | cut -d= -f1 | sed 's/^/$/' | tr '\n' ' ')

for file in /usr/share/nginx/html/assets/*.js; do
    envsubst "$ALLOWED_VARS" < "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
done
