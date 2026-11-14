# Front de GoHealthy

Aplicación en React que consume la API de `gohealthy-back`. Para las reglas de la API, ver [`docs/backend/README.md`](../backend/README.md); para la arquitectura, [`docs/architecture/README.md`](../architecture/README.md).

## Cómo correrlo

```bash
pnpm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
pnpm dev               # http://localhost:5173
```

El back debe estar corriendo, con `CLIENT_URL=http://localhost:5173` en su `.env`.

| Comando | Para qué |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilar para producción |
| `pnpm lint` | Revisar el código con ESLint |

## Stack

- **React 19 + React Router:** `BrowserRouter` en `main.jsx` y las rutas en `App.jsx`, como en el proyecto de clase.
- **Vite** y **Tailwind CSS v4** (configuración en `src/index.css`).
- **shadcn/ui + base-ui:** componentes en `src/components/ui/`. Se agregan con `npx shadcn add <componente>` y no se editan.
- **React Hook Form + Zod:** formularios; los esquemas van en `src/schemas/`.
- **Recharts:** gráficas.
- **fetch:** con `apiFetch` de `src/api/client.js`, que agrega el token, convierte los errores y manda al login si la sesión vence.

## Estructura

```
src/
├── api/          Una función por endpoint, un archivo por recurso
├── components/
│   ├── ui/       shadcn (no se edita)
│   ├── auth/, landing/, nutriologo/, paciente/   Componentes de cada área
│   ├── chat/, perfil/, documentos/, progreso/    Compartidos entre los dos roles
│   └── FormField, FormSelect, DatePicker, ConfirmDialog, ProtectedRoute
├── context/      AuthContext (sesión), PatientsContext y AppointmentsContext
├── hooks/        Datos de una sola pantalla, con useEffect
├── layouts/      NutricionistaLayout, PacienteLayout, PrimerIngresoLayout
├── lib/          Utilidades: fechas, textos, listas, horarios, SMAE, planes, pesos, encuestas
├── pages/        Una página por ruta
├── schemas/      Esquemas de Zod
├── data/         Textos fijos de la landing y de autenticación
├── App.jsx       Rutas
└── main.jsx      BrowserRouter, AuthProvider y Toaster
```

## Rutas

| Ruta | Quién | Página |
|---|---|---|
| `/` | Público | Landing |
| `/auth/login`, `/auth/signin`, `/auth/recovery` | Público | Login, registro de nutriólogo y recuperación de contraseña |
| `/primer-ingreso/contrasena`, `/primer-ingreso/datos` | Paciente nuevo | Cambio de contraseña temporal y onboarding |
| `/nutriologo/dashboard` | Nutriólogo | Solicitudes, citas de hoy y calendario semanal |
| `/nutriologo/pacientes`, `/nutriologo/pacientes/:id` | Nutriólogo | Panel de pacientes y expediente |
| `/nutriologo/pacientes/:id/plan` | Nutriólogo | Constructor del plan |
| `/nutriologo/recetas`, `/nutriologo/reportes` | Nutriólogo | Biblioteca de recetas y reportes |
| `/nutriologo/chat`, `/nutriologo/perfil` | Nutriólogo | Mensajes y perfil |
| `/paciente/plan-alimenticio` | Paciente | Plan, próxima cita y solicitud de cita |
| `/paciente/cuestionario`, `/paciente/cumplimiento` | Paciente | Encuesta del día y resultados |
| `/paciente/progreso`, `/paciente/documentos` | Paciente | Mediciones y gráficas; documentos |
| `/paciente/chat`, `/paciente/perfil` | Paciente | Mensajes; perfil y "Mi nutriólogo" |

`ProtectedRoute` manda a cada usuario a su área según `getHomePath` (`src/lib/home-path.js`): sin sesión al login, el paciente nuevo a su primer ingreso y cada rol solo a lo suyo.

## Convenciones

- Sin punto y coma, comillas simples y alias `@/` para `src/`.
- Las páginas no llaman a `apiFetch` directamente: usan un contexto o un hook. Los datos que comparten varias pantallas van en un contexto; los de una sola, en un hook con `reload`.
- Toda pantalla muestra carga, error y estado vacío. Los avisos son toasts de shadcn; las confirmaciones, `ConfirmDialog`. Nada de `alert()` ni `confirm()`.
- Ramas `feature/<tema>/<persona>`, commits con Conventional Commits en español. Ver `CONTRIBUTING.md` en el repositorio del front.
