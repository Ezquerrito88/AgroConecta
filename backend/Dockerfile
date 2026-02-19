FROM php:8.2-apache

# 1. Instalar dependencias del sistema + SSH para Azure
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
    openssh-server \
    && echo "root:Docker!" | chpasswd \
    && mkdir -p /var/run/sshd \
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

# 6. Copiar configuración SSH de Azure
COPY sshd_config /etc/ssh/sshd_config

# 7. Directorio de trabajo
WORKDIR /var/www/html

# 8. Copiar archivos
COPY . .

# 9. Instalar dependencias de Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 10. Permisos
RUN mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/framework/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# 11. Script de inicio
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting SSH..."\n\
/usr/sbin/sshd\n\
\n\
echo "Linking storage..."\n\
php artisan storage:link --force || true\n\
\n\
if [ "$RUN_MIGRATIONS" = "true" ]; then\n\
  echo "Running Laravel migrations..."\n\
  php artisan migrate --force 2>&1 || echo "Migrations failed, continuing..."\n\
fi\n\
\n\
echo "Optimizing Laravel..."\n\
php artisan config:clear\n\
php artisan route:clear\n\
php artisan view:clear\n\
php artisan config:cache\n\
php artisan route:cache\n\
\n\
echo "Starting Apache..."\n\
exec apache2-foreground\n\
' > /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# 12. Exponer puertos (80 Apache + 2222 SSH Azure)
EXPOSE 80 2222

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
