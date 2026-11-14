# Arquitectura de GoHealthy

GoHealthy es una plataforma para que un nutriólogo dé seguimiento a sus pacientes y cada paciente consulte su plan y registre su avance.

## 1. Piezas

| Pieza | Repositorio | Tecnología |
|---|---|---|
| Front | `gohealthy-front` | React 19, Vite, React Router, Tailwind CSS, shadcn/ui, React Hook Form + Zod, Recharts |
| API | `gohealthy-back` | Node.js, Express, Mongoose, JWT, multer + sharp (imágenes), nodemailer (correos) |
| Base de datos | — | MongoDB |

```
Navegador (React)  ──fetch + token──▶  API Express (/api)  ──Mongoose──▶  MongoDB
                                            │
                                            ├─ public/images  (fotos de perfil, recetas y SMAE, públicas)
                                            ├─ uploads/       (documentos de laboratorio, privados)
                                            └─ Gmail          (correos; si falla, respaldo en la terminal)
```

## 2. Cómo está organizado cada repositorio

**Back (`src/`):** `routes/` (un archivo por recurso) → `controllers/` (una función por endpoint) → `models/` (Mongoose). La lógica que usan varios controladores vive en `services/` (adherencia y peso). `middlewares/` tiene la autenticación (`authenticate`, `authorize`), la subida de archivos y el manejo de errores. `emails/` arma y envía los correos.

**Front (`src/`):** `pages/` (una por ruta, declaradas en `App.jsx`), `components/` (por área y compartidos), `api/` (una función por endpoint), `context/` (sesión, pacientes y citas), `hooks/` (datos de una sola pantalla), `lib/` (utilidades), `schemas/` (validaciones con Zod).

## 3. Modelo de datos

| Colección | Qué guarda | Se relaciona con |
|---|---|---|
| `users` | Nutriólogos y pacientes (`role`) | Un paciente tiene un `nutritionist` |
| `clinicalHistories` | Expediente clínico del paciente (NOM-004) | 1 a 1 con el paciente |
| `consultations` | Notas de evolución: medidas, cálculo energético, diagnóstico | Paciente, nutriólogo y, opcional, la cita |
| `appointments` | Citas y solicitudes de cita | Paciente y nutriólogo |
| `measurements` | Mediciones que registra el paciente | Paciente |
| `wellnessSurveys` | Encuesta diaria de bienestar (una por día) | Paciente |
| `labDocuments` | Documentos de laboratorio (el archivo está en `uploads/`) | Paciente y quien lo subió |
| `messages` | Mensajes entre paciente y nutriólogo | Paciente, remitente y destinatario |
| `smaeGroups`, `smaeFoods` | Catálogo del Sistema Mexicano de Alimentos Equivalentes | Un alimento pertenece a un grupo |
| `recipes` | Biblioteca de recetas (compartidas o del nutriólogo) | Ingredientes del SMAE |
| `mealPlans` | Plan alimenticio activo y sus versiones | Paciente; las comidas copian la receta |
| `mealPlanHistories` | Bitácora: la versión anterior de cada cambio y su motivo | Plan |

## 4. Reglas de negocio importantes

- **Sesión y permisos:** todas las rutas piden token, salvo registro, login y recuperación de contraseña. Quién hace la petición sale del token. Un nutriólogo solo ve a sus pacientes: si pide uno ajeno, la API responde `404`.
- **Primer ingreso del paciente:** el nutriólogo lo da de alta y la API le manda una contraseña temporal; el paciente la cambia y luego llena su onboarding, que alimenta su expediente.
- **Índice de adherencia integral** (`services/adherence.service.js`): con las encuestas de los últimos 7 días se calcula un puntaje de 0 a 100:

  | Componente | Peso | Cómo se califica |
  |---|---|---|
  | Cumplimiento del plan | 35 % | Lo que contestó (0 a 100) |
  | Actividad física | 20 % | Minutos contra 30 al día |
  | Estado de ánimo | 15 % | De 1 a 5, llevado a 0–100 |
  | Sueño | 15 % | 100 entre 7 y 9 horas; baja 25 por cada hora fuera |
  | Agua | 15 % | Vasos contra 8 al día |

  Semáforo: **verde** desde 80, **amarillo** de 60 a 79, **rojo** abajo de 60, y **gris** si no hay encuestas.
- **Peso** (`services/weight.service.js`): junta lo que registra el paciente y lo que se anota en consulta; el peso actual es el registro más reciente de cualquiera de los dos.
- **Trazabilidad del plan:** cada edición sube la versión del plan y guarda la anterior en `mealPlanHistories` con quién la cambió y por qué. El front compara cualquier versión con la actual.
- **Recetas en el plan:** al asignar una receta se copian al plan su nombre, foto, ingredientes y pasos; así se ajustan las porciones para ese paciente y borrar la receta no cambia el historial.
- **Citas:** el nutriólogo agenda; el paciente solicita (queda "Solicitada") y el nutriólogo la acepta, reprograma o rechaza. La API no deja encimar citas.

## 5. Requisitos del proyecto y dónde se cumplen

| Requisito | Dónde |
|---|---|
| **Paciente** | |
| Onboarding inicial | `/primer-ingreso/datos` → `PUT /onboarding` (datos generales, antecedentes y metas) |
| Consulta del plan nutricional | `/paciente/plan-alimenticio`: por día, por hora, cada comida como receta y sus equivalentes del SMAE |
| Registro de documentos | `/paciente/documentos`: PDF o imagen de hasta 10 MB |
| Registro de evolución | `/paciente/progreso`: mediciones (peso, cintura, cadera, brazo, grasa) con historial |
| Encuesta de bienestar | `/paciente/cuestionario`: ánimo, sueño, agua, actividad y cumplimiento del plan |
| Dashboard de progreso | `/paciente/progreso` y `/paciente/cumplimiento`: gráficas de Recharts |
| Agenda y comunicación | Tarjeta de próxima cita con **Solicitar cita**, y `/paciente/chat` |
| **Nutriólogo** | |
| Panel de pacientes | `/nutriologo/pacientes`: activos, con semáforo, peso y meta |
| Expediente clínico (NOM-004) | `/nutriologo/pacientes/:id`: identificación, antecedentes heredofamiliares, patológicos, no patológicos y gineco-obstétricos; consultas (notas de evolución); progreso y encuestas; documentos; plan |
| Calculadora energética | Registrar consulta: Harris-Benedict o Mifflin-St Jeor con factor de actividad |
| Constructor de dietas | `/nutriologo/pacientes/:id/plan`: distribución de equivalentes del SMAE y menú con recetas |
| Gestión de agenda | Dashboard: calendario semanal; aceptar solicitudes, agendar, reprogramar, cancelar y notas por cita |
| Reportes administrativos | `/nutriologo/reportes`: cuatro reportes que cruzan varias colecciones (aggregations) |
| **Transversal** | |
| Índice de adherencia integral | `services/adherence.service.js`; semáforo en el panel y en el expediente |
| Autenticación y autorización | JWT, `authenticate`/`authorize` y filtro por nutriólogo en cada consulta; `ProtectedRoute` en el front |
| Trazabilidad | Historial de versiones del plan y comparación lado a lado |
