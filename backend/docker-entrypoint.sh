#!/bin/bash
set -e

# Generar APP_KEY si no está configurado
if [ -z "$APP_KEY" ] && [ -f .env ]; then
    php artisan key:generate --ansi
fi

# Crear archivo SQLite si no existe
if [ ! -f database/database.sqlite ]; then
    echo "Creando base de datos SQLite..."
    touch database/database.sqlite
    chmod 777 database/database.sqlite
fi

# Ejecutar migraciones si está configurado (con manejo de errores)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Ejecutando migraciones..."
    php artisan migrate --force --ansi || echo "Advertencia: Algunas migraciones fallaron (posiblemente tablas ya existen)"
fi

# Ejecutar seeders si está configurado
if [ "$RUN_SEEDERS" = "true" ]; then
    echo "Ejecutando seeders..."
    php artisan db:seed --force --ansi || echo "Advertencia: Los seeders fallaron"
fi

# Optimizar Laravel para producción
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Asegurar permisos correctos
chown -R www-data:www-data /var/www/html/storage
chown -R www-data:www-data /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage
chmod -R 775 /var/www/html/bootstrap/cache

# Ejecutar el comando proporcionado
exec "$@"
