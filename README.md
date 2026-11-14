# GoHealthy API

Backend de GoHealthy: plataforma para que nutriólogos gestionen a sus pacientes.

## Tecnologías

Node.js, Express, MongoDB y Mongoose. Autenticación con JWT y bcrypt, correos con Nodemailer (Gmail), subida de archivos con Multer e imágenes con Sharp.

## Requisitos

- Node.js LTS y pnpm
- MongoDB Community Server corriendo en local

## Instalación

1. Clonar el repositorio e instalar dependencias:

   ```bash
   pnpm install
   ```

2. Copiar `.env.example` a `.env` y llenar los valores.
3. Levantar el servidor:

   ```bash
   pnpm dev
   ```

La API queda en `http://localhost:<PORT>/api`, con el `PORT` del `.env`.

## Datos iniciales

El catálogo SMAE y la biblioteca inicial de recetas no vienen en el repositorio: se cargan aparte en la base de datos. Sin ellos, `/api/smae` y `/api/recipes` responden listas vacías.

## Documentación

En [`docs/`](docs/README.md): [arquitectura y requisitos](docs/architecture/README.md), [la API endpoint por endpoint](docs/backend/README.md) y [el front](docs/frontend/README.md).

## Credenciales de prueba en la terminal

Con `SHOW_TEST_CREDENTIALS=true` en el `.env`, la terminal muestra (con el prefijo `[PRUEBAS]`) el correo y la contraseña o el código en el registro, el alta y reenvío de acceso de pacientes, el cambio y la recuperación de contraseña y el onboarding. Sirve para probar con correos que no existen. **Para entregar, debe quedar en `false`.**

## Probar los endpoints

Importar en Postman el archivo `postman/gohealthy-api.postman_collection.json` y correr sus carpetas en orden. Los tokens, ids y fechas se guardan solos en las variables de la colección. A mano solo hay que poner la contraseña temporal del paciente y el código de recuperación (llegan por correo o, con `SHOW_TEST_CREDENTIALS=true`, aparecen en la terminal) y elegir los archivos en las peticiones que suben uno.

## Módulos

| Ruta | Descripción |
|---|---|
| `/api/auth` | Registro, login, perfil, cambio y recuperación de contraseña, y datos del nutriólogo para el paciente |
| `/api/patients` | Pacientes, historia clínica e índice de adherencia |
| `/api/onboarding` | Primer ingreso del paciente |
| `/api/consultations` | Notas de evolución |
| `/api/smae` | Catálogo SMAE |
| `/api/recipes` | Biblioteca de recetas |
| `/api/meal-plans` | Planes alimenticios y su historial de cambios |
| `/api/reports` | Reportes para el nutriólogo |
| `/api/measurements` | Mediciones del paciente |
| `/api/wellness-surveys` | Encuestas de bienestar |
| `/api/lab-documents` | Documentos de laboratorio |
| `/api/appointments` | Citas, solicitudes de cita y horarios ocupados |
| `/api/messages` | Mensajes paciente-nutriólogo |
| `/api/dashboard` | Progreso del paciente |

Las imágenes del catálogo y de las recetas se sirven desde `/images`.
