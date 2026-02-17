FROM php:8.2-apache

# 1. Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libsqlite3-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalar extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite zip

# 3. Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Habilitar mod_rewrite
RUN a2enmod rewrite

# 5. Configurar Apache para apuntar a /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 6. Directorio de trabajo
WORKDIR /var/www/html

# 7. Copiar archivos
COPY . .

# 8. Instalar dependencias de Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 9. Permisos
RUN mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/framework/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# 10. Script de inicio mejorado
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
# Crear el enlace simbólico para las imágenes (CRÍTICO para las fotos)\n\
echo "Linking storage..."\n\
php artisan storage:link --force || true\n\
\n\
if [ "$RUN_MIGRATIONS" = "true" ]; then\n\
  echo "Running Laravel migrations..."\n\
  php artisan migrate --force 2>&1 || echo "Migrations failed, continuing..."\n\
fi\n\
\n\
# Limpiar caches viejas para evitar el 404 en rutas nuevas\n\
echo "Optimizing Laravel..."\n\
php artisan config:clear\n\
php artisan route:clear\n\
php artisan view:clear\n\
\n\
# Volver a cachear (opcional en desarrollo, recomendado en producción)\n\
php artisan config:cache\n\
php artisan route:cache\n\
\n\
echo "Starting Apache..."\n\
exec apache2-foreground\n\
' > /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# 11. Exponer puerto y arrancar
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
