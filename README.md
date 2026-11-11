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

## Probar los endpoints

Importar en Postman el archivo `postman/gohealthy-api.postman_collection.json` y correr sus carpetas en orden. Los tokens y los ids se guardan solos en las variables de la colección.

## Módulos

| Ruta | Descripción |
|---|---|
| `/api/auth` | Registro, login, cambio y recuperación de contraseña |
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
| `/api/appointments` | Citas |
| `/api/messages` | Mensajes paciente-nutriólogo |
| `/api/dashboard` | Progreso del paciente |

Las imágenes del catálogo y de las recetas se sirven desde `/images`.
