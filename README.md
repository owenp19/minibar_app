# ChargeIt Hotel — Minibar Nattivo Collection

> Sistema de gestión de minibar para hoteles. Control de inventario, consumos, pérdidas, reportes y dashboard de métricas en tiempo real.

## Descripción

ChargeIt Hotel es una aplicación web progresiva (PWA) diseñada para la gestión integral del servicio de minibar en el **Nattivo Collection Hotel**. Permite al personal del hotel registrar consumos por habitación, controlar el inventario, gestionar pérdidas o daños, generar reportes (PDF/Excel), y enviar resúmenes vía WhatsApp a recepción.

## Objetivo

Digitalizar y optimizar el proceso de control de minibar en hoteles, reemplazando registros en papel por un sistema digital rápido, offline-capable, bilingüe (ES/EN) y con apariencia profesional tipo aplicación móvil.

## Tecnologías utilizadas

### Backend
- **Node.js** + **Express** — Servidor HTTP y API REST
- **MySQL 2** — Conexión a base de datos relacional
- **bcryptjs** — Hash de contraseñas
- **express-session** — Autenticación por sesión
- **express-rate-limit** — Límite de peticiones (200/min)
- **helmet** — Seguridad HTTP
- **dotenv** — Variables de entorno
- **multer** — Subida de imágenes/avatares
- **pdfkit** — Generación de reportes PDF
- **exceljs** — Exportación a Excel
- **chart.js** — Gráficos del dashboard (servido desde CDN)

### Frontend
- **HTML5 / CSS3 / JavaScript (vanilla)** — Sin frameworks
- **Phosphor Icons** — Iconografía ligera
- **Google Fonts** — Anton SC + Roboto
- **Service Worker** — Cache offline del app shell
- **Manifest Web** — Instalación como PWA
- **CSS Custom Properties** — Sistema de temas claro/oscuro
- **i18n** — Internacionalización ES/EN integrada

## Estructura de carpetas

```
minibar-app/
├── server.js                    # Punto de entrada del servidor
├── package.json                 # Dependencias y scripts
├── .env                         # Variables de entorno (no incluir en repo)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore
├── README.md
├── plan-transformacion-multitenant.pdf
│
├── src/
│   ├── app.js                   # Configuración de Express (middleware, rutas, estáticos)
│   ├── auditLogger.js           # Sistema de auditoría estructurado
│   ├── pdfHelper.js             # Clase para generar PDFs con marca de agua
│   │
│   ├── config/
│   │   └── db.js                # Pool de conexión MySQL
│   │
│   ├── middleware/
│   │   └── errorHandler.js      # Manejador global de errores
│   │
│   ├── repositories/            # Capa de acceso a datos
│   │   ├── productRepository.js
│   │   ├── roomRepository.js
│   │   └── consumptionRepository.js
│   │
│   ├── routes/                  # Rutas de la API (11 módulos)
│   │   ├── authRoutes.js        #   /api/auth/*
│   │   ├── adminRoutes.js       #   /api/admin/*
│   │   ├── minibarRoutes.js     #   /api/minibar/*
│   │   ├── consumptionRoutes.js #   /api/consumptions/*
│   │   ├── perdidasRoutes.js    #   /api/perdidas/*
│   │   ├── notificationRoutes.js#   /api/notifications/*
│   │   ├── auditRoutes.js       #   /api/audit/*
│   │   ├── dashboardRoutes.js   #   /api/dashboard/*
│   │   ├── roomRoutes.js        #   /api/rooms
│   │   ├── productRoutes.js     #   /api/products
│   │   └── unlockRoutes.js      #   /api/unlock/*
│   │
│   └── db/
│       ├── seed.js              # Creación de esquema + datos iniciales
│       └── migrate.js           # Migraciones (ej: tabla de pérdidas)
│
└── public/
    ├── index.html               # Shell principal de la SPA
    ├── login.html               # Página de inicio de sesión
    ├── registro.html            # Registro de nuevos usuarios
    ├── admin.html               # Panel de administración
    ├── dashboard.html           # Dashboard con KPIs y gráficos
    ├── minibar.html             # Gestión de minibar por habitación
    ├── perfil.html              # Perfil de usuario
    ├── revision-rapida.html     # Revisión rápida de habitaciones
    ├── unlock.html              # Desbloqueo de funcionalidades
    ├── settings.html            # Configuración de la aplicación
    ├── auditoria.html           # Registro de auditoría
    ├── notificaciones.html      # Notificaciones de productos próximos a vencer
    ├── perdidas.html            # Registro de pérdidas y daños
    ├── reportes.html            # Generación de reportes PDF/Excel
    │
    ├── css/
    │   ├── theme.css            # Variables CSS (colores, sombras, radios)
    │   ├── app.css              # Estilos principales de la SPA
    │   ├── login.css            # Estilos de la página de login
    │   ├── chatbot.css          # Estilos del chatbot flotante
    │   └── register.css         # Estilos del formulario de registro
    │
    ├── js/
    │   ├── app.js               # Lógica principal de la SPA
    │   ├── theme.js             # Controlador de tema claro/oscuro
    │   ├── i18n.js              # Sistema de traducción ES/EN
    │   ├── login.js             # Lógica de inicio de sesión
    │   ├── register.js          # Lógica de registro
    │   ├── minibar.js           # Lógica de la página de minibar
    │   ├── perfil.js            # Lógica del perfil de usuario
    │   ├── revision-rapida.js   # Lógica de revisión rápida
    │   ├── chatbot.js           # Lógica del chatbot
    │   └── dashboard.js         # Gráficos del dashboard (Chart.js)
    │
    ├── sw.js                    # Service Worker (cache offline)
    ├── manifest.webmanifest     # Manifest PWA
    ├── favicon.ico
    ├── images/                  # Logo, iconos, imágenes
    └── icons/                   # Iconos para PWA
```

## Explicación de módulos y páginas

| Módulo/Página | Ruta | Descripción |
|---|---|---|
| **Login** | `/login.html` | Inicio de sesión con correo y contraseña |
| **Registro** | `/registro.html` | Creación de cuenta con código admin `7777` |
| **Dashboard** | `/app/dashboard` | KPIs: habitaciones, consumos, ingresos, productos top |
| **Minibar** | `/app/minibar` | Gestión de inventario por piso/habitación |
| **Revisión rápida** | `/app/revision-rapida` | Escaneo rápido de estado de habitaciones |
| **Admin** | `/app/admin` | CRUD de productos, usuarios y categorías |
| **Perfil** | `/perfil` | Edición de perfil y avatar |
| **Pérdidas** | `/app/perdidas` | Registro de pérdidas y daños |
| **Reportes** | `/app/reportes` | Generación de reportes PDF/Excel |
| **Auditoría** | `/app/auditoria` | Visualización de registros de auditoría |
| **Notificaciones** | `/app/notificaciones` | Alertas de productos próximos a vencer |
| **Configuración** | `/settings` | Ajustes de tema e idioma |
| **Desbloqueo** | `/unlock.html` | Desbloqueo de funcionalidades |

## Instalación

### Requisitos

- Node.js 18+
- MySQL 8+
- npm

### Pasos

1. Clona el repositorio:
```bash
git clone https://github.com/tuusuario/minibar-app.git
cd minibar-app
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales de base de datos:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=minibar_app
SESSION_SECRET=una_clave_segura_aleatoria
PORT=3000
```

4. Crea la base de datos MySQL:
```sql
CREATE DATABASE minibar_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Ejecuta el seed para crear tablas y datos iniciales:
```bash
npm run seed
```

6. Inicia el servidor en desarrollo:
```bash
npm run dev
```

7. Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

## Cómo ejecutar

### Desarrollo
```bash
npm run dev
```
Usa `node --watch` para reinicio automático en cambios.

### Producción
```bash
npm start
```

### Seed de base de datos
```bash
npm run seed
```

## Configuración necesaria

### WhatsApp
En `public/js/app.js`, actualiza la constante `WHATSAPP_PHONE` con el número de teléfono de recepción (formato internacional, ej: `573001234567`).

### Productos e inventario
El seed inicial crea productos de ejemplo (gaseosas, cervezas, snacks, licores) con inventario por habitación. Puedes modificarlos desde el panel `/app/admin`.

## Sistema de autenticación

ChargeIt Hotel usa **autenticación por sesión** con Express Session.

- Las contraseñas se almacenan hasheadas con **bcryptjs**.
- Las sesiones se almacenan en memoria (Express MemoryStore por defecto).
- El registro requiere un **código de administrador** (`7777`) para evitar registros no autorizados.
- La sesión se verifica en cada ruta protegida mediante middleware.
- Al cerrar sesión, la sesión se destruye y se redirige al login.

### Roles y permisos

| Rol | Acceso |
|---|---|
| **admin** | Todas las funcionalidades: CRUD productos, usuarios, reportes, dashboard, auditoría |
| **operator** | Funcionalidades operativas: registro de consumos, revisión rápida, pérdidas, perfil |

## Usuarios de prueba (demo)

El siguiente usuario se crea automáticamente al ejecutar `npm run seed`:

| Rol | Correo | Contraseña | Módulos disponibles |
|---|---|---|---|
| **Administrador** | `minibar@nattivo.app` | `minibar123` | Todos los módulos (admin, dashboard, minibar, reportes, auditoría, etc.) |

> ⚠️ Estas credenciales son de prueba. **Cambia la contraseña** antes de usar en producción.

## Funcionalidades actuales

- Autenticación por sesión con roles (admin/operator)
- Dashboard con KPIs y gráficos (Chart.js)
- Gestión de minibar por piso/habitación
- Registro de consumos con envío a WhatsApp
- Control de inventario con ajustes y reabastecimiento
- Registro de pérdidas y daños
- Generación de reportes PDF y Excel
- Vista de auditoría con filtros
- Notificaciones de productos próximos a vencer
- Perfil de usuario con avatar
- Tema claro/oscuro
- Internacionalización ES/EN
- PWA instalable con Service Worker
- Diseño responsive (mobile-first)
- Chatbot flotante con preguntas frecuentes
- Búsqueda rápida de habitaciones
- Carga diferida de imágenes (lazy loading)
- Animaciones y transiciones suaves
- Elementos interactivos con border-radius: 50px (estilo pill)

## Mejoras recomendadas

- Migrar a **PostgreSQL** para mayor escalabilidad
- Implementar **WebSockets** para actualizaciones en tiempo real
- Agregar **modo multitenant** (varios hoteles) — ya existe un plan en `plan-transformacion-multitenant.pdf`
- Migrar sesiones a **Redis** para entornos multi-instancia
- Agregar **pruebas automatizadas** (Jest / Supertest)
- Implementar **CI/CD** (GitHub Actions)
- Migrar a un framework frontend moderno (React, Vue o Svelte) si el equipo crece
- Agregar **notificaciones push** para alertas de vencimiento
- Implementar **escaneo de código de barras** para inventario
- Sistema de **facturación electrónica**
- Integración con **PMS** (Property Management System)
- Panel de **analítica avanzada** con exportación a CSV/JSON
- **Modo offline completo** con IndexedDB para operar sin conexión

## Posibles herramientas/librerías para agregar

- **Socket.IO** — Tiempo real
- **Redis** — Sesiones distribuidas
- **Zustand / Pinia** — Estado global (si se migra a frontend moderno)
- **TailwindCSS** — Estilos utility-first
- **Playwright** — Testing E2E
- **Sentry** — Monitoreo de errores
- **Lighthouse CI** — Performance budget
- **i18next** — Internacionalización avanzada
- **Workbox** — Service Worker avanzado
- **Chart.js v4 plugins** — Gráficos más ricos

## Recomendaciones para mejora tipo app

- Ya implementado: PWA, manifest, service worker, tema nativo, splash screen
- Recomendado: **Pantalla de bienvenida onboarding**, **gestos táctiles** (swipe para navegar), **modo offline completo**, **sincronización en segundo plano**, **notificaciones push**, **widget de resumen rápido**

## Estado actual del proyecto

**Versión:** 2.0.1
**Estado:** Funcional en producción. Implementado en Nattivo Collection Hotel.
**Base de datos:** MySQL con seed inicial.

## Próximos pasos sugeridos

1. Configurar base de datos MySQL en producción
2. Ejecutar `npm run seed` para crear tablas y datos iniciales
3. Configurar HTTPS detrás de un proxy reverso (Nginx/Caddy)
4. Cambiar `SESSION_SECRET` en `.env` por un valor seguro
5. Configurar el número de WhatsApp en `public/js/app.js`
6. Revisar reglas de firewall y seguridad del servidor
7. Implementar respaldo automático de la base de datos
8. Realizar pruebas de carga antes del despliegue

## Seguridad

### Credenciales
El archivo `.env` contiene credenciales de base de datos y una clave secreta de sesión. **No se debe subir al repositorio** (ya está en `.gitignore`).

### Recomendaciones de seguridad
- Cambiar la contraseña de root de MySQL
- Usar un usuario de base de datos con permisos limitados
- Configurar HTTPS en producción
- Cambiar el `SESSION_SECRET` por un valor único y seguro
- Eliminar el código de registro admin (`7777`) o moverlo a variable de entorno
- Agregar rate limiting más estricto en rutas de autenticación
- Implementar validación del lado del servidor para todos los inputs
- Usar Helmet correctamente configurado para producción

### Información sensible encontrada
- En `.env`: `DB_PASSWORD=` vacío (base de datos sin contraseña)
- En `.env`: `SESSION_SECRET` hardcodeado — debe ser único por instancia
- En `src/db/seed.js`: Código de registro admin `7777` hardcodeado
- En `public/js/app.js`: Número de WhatsApp placeholder `573001234567`

---

**Desarrollado por Owen Pusey — Minibar Hotel Nattivo**  
*v2.0.1*
