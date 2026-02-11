# 🐳 Docker - AgroConecta

Esta guía explica cómo ejecutar la aplicación AgroConecta usando Docker.

## 📋 Requisitos

- [Docker](https://docs.docker.com/get-docker/) (versión 20.10 o superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (versión 1.29 o superior)

## 🚀 Inicio Rápido

### 1. Construir y ejecutar la aplicación

```bash
docker-compose up --build
```

### 2. Acceder a la aplicación

- **Frontend (Angular)**: http://localhost:4200
- **Backend API (Laravel)**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health

### 3. Detener la aplicación

```bash
# Detener contenedores (conservar datos)
docker-compose down

# Detener contenedores y eliminar volúmenes (borrar datos)
docker-compose down -v
```

## 📁 Estructura de Archivos Docker

```
AgroConecta/
├── docker-compose.yml          # Orquestación de servicios
├── backend/
│   ├── Dockerfile              # Imagen del backend Laravel
│   ├── docker-entrypoint.sh    # Script de inicio
│   └── .dockerignore           # Archivos excluidos del build
├── frontend-agro/
│   ├── Dockerfile              # Imagen del frontend Angular
│   ├── nginx.conf              # Configuración de nginx
│   └── .dockerignore           # Archivos excluidos del build
└── DOCKER_README.md            # Esta guía
```

## 🔧 Configuración

### Variables de Entorno del Backend

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `APP_ENV` | Entorno de la aplicación | `production` |
| `APP_DEBUG` | Modo debug | `false` |
| `APP_URL` | URL de la aplicación | `http://localhost:8000` |
| `DB_CONNECTION` | Tipo de base de datos | `sqlite` |
| `RUN_MIGRATIONS` | Ejecutar migraciones al iniciar | `true` |
| `RUN_SEEDERS` | Ejecutar seeders al iniciar | `false` |

### Puertos

| Servicio | Puerto Host | Puerto Contenedor | Descripción |
|----------|-------------|-------------------|-------------|
| Backend | 8000 | 80 | API Laravel |
| Frontend | 4200 | 80 | Aplicación Angular |

## 💾 Volúmenes Persistentes

Los siguientes volúmenes se mantienen entre reinicios:

- `backend-storage`: Almacenamiento de archivos (imágenes, logs)
- `backend-database`: Base de datos SQLite

## 🔍 Comandos Útiles

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Ejecutar comandos en el backend

```bash
# Acceder al contenedor del backend
docker-compose exec backend bash

# Ejecutar migraciones manualmente
docker-compose exec backend php artisan migrate --force

# Ejecutar seeders
docker-compose exec backend php artisan db:seed --force

# Limpiar caché
docker-compose exec backend php artisan cache:clear
```

### Reconstruir un servicio específico

```bash
# Solo backend
docker-compose up --build backend

# Solo frontend
docker-compose up --build frontend
```

## 🌐 Desarrollo vs Producción

### Modo Desarrollo

Para desarrollo local, puedes modificar el `docker-compose.yml`:

```yaml
backend:
  environment:
    - APP_ENV=local
    - APP_DEBUG=true
  volumes:
    - ./backend:/var/www/html  # Montar código fuente
```

### Modo Producción

La configuración actual está optimizada para producción:
- Caché de configuración, rutas y vistas habilitada
- Sin archivos de desarrollo
- Compresión gzip habilitada
- Health checks configurados

## 🐛 Solución de Problemas

### Error de permisos

```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 775 /var/www/html/storage
```

### Base de datos bloqueada

```bash
docker-compose down
docker-compose up -d
```

### Reconstruir desde cero

```bash
docker-compose down -v
docker-compose up --build
```

## 📚 Notas Adicionales

- El backend usa **SQLite** como base de datos (no requiere MySQL/PostgreSQL)
- Las imágenes de productos se almacenan en el volumen `backend-storage`
- El frontend se sirve con **nginx** optimizado para SPA (Single Page Application)
- Los health checks verifican que los servicios estén funcionando correctamente

## 🤝 Soporte

Si encuentras algún problema, revisa los logs con:

```bash
docker-compose logs -f
```
