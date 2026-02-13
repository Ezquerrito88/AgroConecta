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

# 10. Script de inicio CONDICIONAL (respeta RUN_MIGRATIONS)
RUN printf '#!/bin/bash\nset -e\nif [ "$RUN_MIGRATIONS" = "true" ]; then\n  echo "Running Laravel migrations..."\n  php artisan migrate --force 2>&1 || echo "Migrations failed, continuing..."\n  echo "Caching configuration..."\n  php artisan config:cache 2>&1 || true\n  php artisan route:cache 2>&1 || true\nelse\n  echo "Skipping migrations (RUN_MIGRATIONS=false)"\nfi\necho "Starting Apache..."\nexec apache2-foreground\n' > /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# 11. Exponer puerto y arrancar
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
