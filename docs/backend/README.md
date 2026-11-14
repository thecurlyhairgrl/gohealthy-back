# Contexto del backend de GoHealthy

Este documento explica la API de GoHealthy: cómo conectarse, las reglas y cada endpoint. Es el mismo en los repositorios del front y del back. **El back es la fuente de verdad:** si una pantalla no coincide con lo que dice aquí, se cambia la pantalla, no la API.

- **Repositorio del back:** `gohealthy-back` (Node.js + Express + MongoDB con Mongoose).
- **Arquitectura y modelo de datos:** [`docs/architecture/README.md`](../architecture/README.md).
- **Front:** [`docs/frontend/README.md`](../frontend/README.md).

---

## 1. Conexión

| Dato | Valor |
|---|---|
| URL base | `http://localhost:3000/api`, en `VITE_API_URL` |
| Imágenes | Fuera de `/api`: la API regresa rutas como `/images/recipes/tacos.webp`, que se sirven en `http://localhost:3000/images/...` |
| Formato | JSON, salvo subidas de archivos (`multipart/form-data`) y descargas de documentos (archivo binario) |
| CORS | El back solo acepta peticiones desde su `CLIENT_URL`, que debe ser `http://localhost:5173` |

Para levantarlo: en `gohealthy-back`, `pnpm install` y luego `pnpm dev`, con su `.env` lleno y MongoDB corriendo. El catálogo SMAE y las recetas compartidas se cargan una vez en la base; en una base vacía, `/api/smae` y `/api/recipes` responden listas vacías.

---

## 2. Sesión y roles

- **Login:** `POST /auth/login` responde `{ token, user }`. El token dura 8 horas.
- **Token:** se manda en cada petición como `Authorization: Bearer <token>`. Todas las rutas lo piden, salvo `register`, `login`, `forgot-password`, `verify-otp` y `reset-password`.
- **Roles:** `nutritionist` y `patient`. El usuario y su rol salen del token: **el front nunca manda `senderId`, `userId`, `nutritionistId` ni el `patientId` del paciente que inició sesión**.
- **Un nutriólogo solo ve a sus pacientes.** Si pide datos de uno ajeno, la API responde `404`, como si no existiera.
- **Registro:** solo los nutriólogos se registran solos. A los pacientes los da de alta su nutriólogo.

### Primer ingreso del paciente

1. El nutriólogo crea al paciente. La API genera una contraseña temporal y se la manda por correo. Si el correo falla, la imprime en la terminal del back (y siempre, si `SHOW_TEST_CREDENTIALS=true`; ver la sección 8).
2. El paciente inicia sesión con `user.mustChangePassword: true` y debe cambiarla (`PUT /auth/change-password`).
3. Después completa el onboarding (`PUT /onboarding`); `user.onboardingCompleted` es `false` hasta que lo haga.
4. El back no deja completar el onboarding sin haber cambiado la contraseña (`403`). El resto del orden lo controla el front.

---

## 3. Errores

Todos los errores traen `message` en español. Los de validación agregan `details`, con los textos de Mongoose en inglés.

```json
{ "message": "Hay datos inválidos", "details": ["Path `weightKg` is required."] }
```

| Código | Significa | Qué hace el front |
|---|---|---|
| `400` | Datos inválidos o id con formato incorrecto | Mostrar `message` en el formulario |
| `401` | Sin sesión, token vencido, o login incorrecto | Ir al login, salvo en el formulario de login |
| `403` | Ese rol no puede hacer eso | Ocultar la acción |
| `404` | No existe o no es de este usuario | Estado "no encontrado" o vacío |
| `409` | Duplicado o choque: correo ya registrado, encuesta del día ya contestada, o cita que se encima con otra | Mostrar `message` |
| `502` | Falló el correo en *Reenviar acceso* | Mostrar `message` |
| `500` | Error del servidor | Mensaje genérico |

---

## 4. Modelos

Campos que regresa la API (además de `_id`, `createdAt` y `updatedAt`). Los marcados con `*` son obligatorios al crear.

| Modelo | Campos |
|---|---|
| **User** | `firstName*`, `paternalLastName*`, `maternalLastName`, `email*`, `role*` (`nutritionist`, `patient`), `phone`, `avatarUrl`, `active`, `mustChangePassword`, `onboardingCompleted`, `nutritionist` (id, solo pacientes). Del nutriólogo: `professionalLicense`, `specialty`, `university`, `officeAddress`, `bio` |
| **ClinicalHistory** | `identification` (`birthDate`, `sex`: `female`/`male`, `maritalStatus`, `occupation`, `education`, `address` {`street`, `neighborhood`, `city`, `state`, `zipCode`}), `reasonForVisit`, `goals` (arreglo), `weightGoalKg`, `bodyFatGoalPct`, `familyHistory` [{`condition*`, `relationship`}], `pathologicalHistory` (`diseases`, `surgeries`, `allergies`, `medications`: arreglos de texto), `nonPathologicalHistory` (`smoking`, `alcoholConsumption`: `never`/`occasional`/`frequent`, `physicalActivity`, `sleepHours`), `eatingHabits` (`mealsPerDay`, `eatsOut`, `preferredFoods`, `dislikedFoods`), `gynecoObstetricHistory` (`pregnancies`, `lastMenstrualPeriod`, `contraceptiveMethod`) |
| **Consultation** | `patient*`, `date`, `appointment`, `measurements` (`weightKg`, `heightCm`, `bmi`, `waistCm`, `hipCm`, `bodyFatPct`, `systolicPressure`, `diastolicPressure`), `energyCalculation` (`formula`: `harris-benedict`/`mifflin-st-jeor`, `activityFactor`, `basalEnergyExpenditure`, `totalEnergyExpenditure`, `targetKcal`), `diagnosis`, `prognosis`, `instructions`, `notes`. El back calcula `bmi` |
| **Appointment** | `patient*`, `nutritionist`, `dateTime*`, `durationMin` (mínimo 15, 60 por defecto), `status` (`requested`, `scheduled`, `rescheduled`, `cancelled`, `completed`), `modality` (`in-person` por defecto, `video-call`), `reason`, `notes`, `consultation` |
| **Measurement** | `date`, `weightKg*`, `waistCm`, `hipCm`, `armCm`, `bodyFatPct` (0 a 100), `notes` (máx. 500) |
| **WellnessSurvey** | `date*` (`AAAA-MM-DD`), `mood*` (1 a 5), `sleepHours*` (0 a 24), `waterGlasses*` (0 a 30), `activityMinutes*` (0 a 1440), `planAdherence*` (0 a 100), `comment` (máx. 500). **Una por paciente por día** |
| **LabDocument** | `patient`, `uploadedBy`, `originalName`, `mimeType` (PDF, JPG o PNG), `sizeBytes` (máx. 10 MB), `description`, `studyDate` |
| **Message** | `patient`, `sender`, `recipient`, `subject` (máx. 150), `body*` (máx. 5000), `read`, `readAt` |
| **SmaeGroup** | `key`, `category`, `name`, `subgroup`, `energyKcal`, `proteinG`, `lipidsG`, `carbohydratesG`, `imageUrl`. Son 19 |
| **SmaeFood** | `name`, `groupKey`, `suggestedQuantity`, `unit`, `grossWeightG`, `netWeightG`, `energyKcal`, `proteinG`, `lipidsG`, `carbohydratesG`, `fiberG`, `sodiumMg`, `imageUrl` (si no tiene foto, la API regresa la de su grupo) |
| **Recipe** | `nutritionist` (`null` = compartida), `name*`, `imageUrl`, `mealTimes`, `prepMinutes`, `ingredients*` [{`food`, `name`, `groupKey`, `equivalents`, `quantity`, `unit`}], `steps*` (arreglo de texto) |
| **MealPlan** | `patient*`, `name`, `active`, `version`, `startDate`, `targetKcal`, `waterLiters`, `notes`, `distribution` [{`mealTime`, `equivalents` [{`groupKey`, `quantity`}]}], `menu` [{`day`, `meals` [{`mealTime`, `title`, `recipe`, `imageUrl`, `foods`, `steps`, `preparation`}]}] |

Valores fijos:

- **`mealTime`:** `breakfast`, `morning-snack`, `lunch`, `afternoon-snack`, `dinner`.
- **`day`:** `monday` … `sunday`.
- **`adherence.status`:** `green`, `yellow`, `red`, `no-data`.

La API usa los valores en inglés; el front los traduce solo al mostrarlos.

---

## 5. Endpoints

"Nutri" es nutriólogo. Todo lo que no diga "Público" requiere token.

### 5.1 Autenticación

| Método y ruta | Quién | Cuerpo | Respuesta |
|---|---|---|---|
| `POST /auth/register` | Público | `firstName`, `paternalLastName`, `maternalLastName?`, `email`, `password`, `phone?`, `professionalLicense?` | `{ token, user }` |
| `POST /auth/login` | Público | `email`, `password` | `{ token, user }` |
| `GET /auth/me` | Ambos | — | `user` |
| `PUT /auth/me` | Ambos | Paciente: `firstName`, `paternalLastName`, `maternalLastName`, `phone`. El nutri además: `professionalLicense`, `specialty`, `university`, `officeAddress`, `bio` | `user` |
| `POST /auth/me/avatar` | Ambos | `FormData` con el campo `image` | `user` con `avatarUrl` |
| `GET /auth/me/nutritionist` | Paciente | — | Datos públicos de su nutriólogo: nombre, correo, teléfono, foto, cédula, especialidad, universidad, consultorio y biografía |
| `PUT /auth/change-password` | Ambos | `currentPassword`, `newPassword` | `{ message }` |
| `POST /auth/forgot-password` | Público | `email` | `{ message }` |
| `POST /auth/verify-otp` | Público | `email`, `code` | `{ message }` |
| `POST /auth/reset-password` | Público | `email`, `code`, `newPassword` | `{ message }` |

- La contraseña pide al menos 8 caracteres.
- `PUT /auth/me` ignora cualquier otro campo, como `email`, `role` o `active`. Solo cambia lo que se manda.
- La foto de perfil acepta JPG, PNG o WebP de al menos 200x200 píxeles. Queda en 400x400, recortada al centro: conviene avisar que se recorta en cuadrado. Mostrarla con `getImageUrl(user.avatarUrl)`.

### 5.2 Pacientes y expediente (solo nutri)

| Método y ruta | Uso | Respuesta |
|---|---|---|
| `GET /patients?search=&includeInactive=` | Panel | Lista de pacientes, cada uno con `adherence`, `lastConsultation`, `totalConsultations`, `currentWeightKg` y `weightGoalKg` |
| `POST /patients` | Alta | `{ patient, clinicalHistory, emailSent }` |
| `GET /patients/:id` | Expediente | `{ patient, clinicalHistory, adherence }` |
| `PUT /patients/:id` | Editar o desactivar | `patient` |
| `POST /patients/:id/resend-access` | Reenviar contraseña temporal | `{ message }` |
| `GET /patients/:id/clinical-history` | Historia clínica | `clinicalHistory` |
| `PUT /patients/:id/clinical-history` | Editar historia | `clinicalHistory` |
| `GET /patients/:id/adherence?days=7` | Semáforo | `{ score, status, days, surveysCount, components }` |

- **Alta:** `firstName`, `paternalLastName`, `maternalLastName?`, `email`, `phone?`, `birthDate?`, `sex?`, `reasonForVisit?`. Si `emailSent` es `false`, avisar y ofrecer *Reenviar acceso*.
- **Editar:** solo `firstName`, `paternalLastName`, `maternalLastName`, `phone`, `active`. Desactivar es `{ "active": false }`; no se borran pacientes.
- **Metas:** `weightGoalKg` y `bodyFatGoalPct` se editan con `PUT /patients/:id/clinical-history`. Solo el nutriólogo las pone; el onboarding las ignora.
- **Adherencia:** sin encuestas, `score` y `components` vienen `null`. Mostrar "basado en `surveysCount` de `days` días".

### 5.3 Onboarding (solo paciente)

| Método y ruta | Uso | Respuesta |
|---|---|---|
| `GET /onboarding` | Rellenar el formulario | `{ mustChangePassword, onboardingCompleted, clinicalHistory }` |
| `PUT /onboarding` | Guardar y completar | `{ message, clinicalHistory }` |

- Campos: `identification`, `goals`, `familyHistory`, `pathologicalHistory`, `nonPathologicalHistory`, `eatingHabits`, `gynecoObstetricHistory`.
- Responde `403` si aún tiene la contraseña temporal.
- Cargar con el `GET` y mandar `identification` completo, para no borrar lo que capturó el nutriólogo.
- Después de guardar, actualizar `user` con `GET /auth/me`.

### 5.4 Consultas (solo nutri)

| Método y ruta | Uso |
|---|---|
| `GET /consultations?patientId=` | Historial, de la más reciente a la más antigua |
| `GET /consultations/:id` | Detalle |
| `POST /consultations` | Registrar |
| `PUT /consultations/:id` | Editar |

Cuerpo: `patientId`, `appointmentId?`, `date?`, `measurements`, `energyCalculation`, `diagnosis`, `prognosis`, `instructions`, `notes`.

- El back calcula `measurements.bmi` si vienen `weightKg` y `heightCm`.
- Con `appointmentId`, la cita queda `completed` y ligada a la consulta.
- `energyCalculation` lo calcula el front: `formula` (`harris-benedict` o `mifflin-st-jeor`), `activityFactor`, `basalEnergyExpenditure`, `totalEnergyExpenditure`, `targetKcal`.

### 5.5 Mediciones, encuestas y dashboard

El **paciente** nunca manda `patientId`: sale del token. El **nutriólogo** manda `?patientId=` para consultar, y solo funciona con sus pacientes.

| Método y ruta | Quién |
|---|---|
| `GET /measurements` | Ambos |
| `POST /measurements` | Paciente: `date?`, `weightKg`, `waistCm?`, `hipCm?`, `armCm?`, `bodyFatPct?`, `notes?` |
| `PUT /measurements/:id`, `DELETE /measurements/:id` | Paciente |
| `GET /wellness-surveys` | Ambos |
| `POST /wellness-surveys` | Paciente: `date`, `mood` (1–5), `sleepHours`, `waterGlasses`, `activityMinutes`, `planAdherence` (0–100), `comment?` |
| `GET /dashboard/progress?days=90` | Ambos |

- Una encuesta por día: la segunda responde `409`.
- El dashboard responde `{ days, measurements, weights, surveys, summary, goals }`, con las series ordenadas por fecha para Recharts:
  - `weights`: el peso de las mediciones del paciente **y** de las consultas, cada registro con `source` (`patient` o `consultation`). Es la serie para la gráfica de peso.
  - `summary`: `totalMeasurements`, `totalWeights`, `totalSurveys` y `weightChangeKg` del periodo (con `weights`).
  - `goals`: `initialWeightKg` (primer registro de peso de siempre, de medición o de consulta), `currentWeightKg` (el más reciente), `weightGoalKg`, `goalProgressPct` (0 a 100), `currentBodyFatPct` y `bodyFatGoalPct`. Lo que no exista viene en `null`.
- **Cumplimiento y cuestionarios usan esta misma encuesta.** *Cumplimiento* muestra cómo sigue el plan (`planAdherence`, más el semáforo de adherencia), y *Cuestionarios* el estado general (ánimo, sueño, agua, actividad). La racha de días se calcula en el front con las fechas de las encuestas.

### 5.6 Documentos de laboratorio

| Método y ruta | Quién | Nota |
|---|---|---|
| `GET /lab-documents` | Ambos | Nutri con `?patientId=` |
| `POST /lab-documents` | Ambos | `FormData`: `file`, `description?`, `studyDate?`. El nutri agrega `patientId` |
| `GET /lab-documents/:id/file` | Ambos | Binario |
| `DELETE /lab-documents/:id` | Ambos | Solo quien lo subió (`uploadedBy`) |

Se aceptan PDF, JPG y PNG de hasta 10 MB. **La descarga no funciona con un enlace**, porque `<a href>` no manda el token:

```js
await downloadFile(`/lab-documents/${doc._id}/file`, doc.originalName)
```

Usar `originalName` de la lista: el servidor no expone el nombre en los headers.

### 5.7 Citas

| Método y ruta | Quién | Nota |
|---|---|---|
| `GET /appointments?patientId=&from=&to=` | Ambos | Cada quien ve las suyas. Solo el nutri usa `patientId` |
| `GET /appointments/availability?date=AAAA-MM-DD` | Ambos | Horarios ocupados de ese día (`dateTime`, `durationMin`), sin datos de los pacientes. El paciente ve los de su nutriólogo |
| `GET /appointments/:id` | Ambos | |
| `POST /appointments` | Ambos | Nutri: `patientId`, `dateTime`, `modality?`, `durationMin?`, `reason?`, `notes?`; queda `scheduled`. Paciente: `dateTime`, `modality?`, `reason?`; queda `requested` (solicitud) y se avisa al nutriólogo |
| `PUT /appointments/:id` | Nutri | `dateTime`, `modality`, `durationMin`, `reason`, `notes`, `status`. Solo cambia lo que se manda |

- **Estados:** `requested` (la solicitó el paciente), `scheduled`, `rescheduled`, `cancelled` y `completed`.
- **Aceptar una solicitud** es `{ "status": "scheduled" }`; rechazarla o cancelar una cita es `{ "status": "cancelled" }`. En los dos casos se avisa al paciente por correo.
- Cambiar `dateTime` deja la cita en `rescheduled` y avisa por correo.
- **No se encima:** crear o mover una cita a un horario que choca con otra no cancelada responde `409`. Las citas nuevas deben ser en el futuro (`400`).
- `patient` y `nutritionist` vienen con su nombre en la lista y en el detalle. `POST` y `PUT` regresan solo sus ids.
- Para el calendario, pedir solo el rango visible con `from` y `to`.

### 5.8 Mensajes

Funcionan como una bandeja de correo, no en tiempo real: los mensajes se guardan y aparecen al recargar o al volver a pedirlos.

`GET /messages/conversations` es la lista del nutriólogo: un elemento por paciente activo, con `patient` (nombre y `avatarUrl`), `lastMessage` (`body`, `subject`, `createdAt`, `senderRole`, o `null`) y `unread`. Viene ordenada por el mensaje más reciente.

| Método y ruta | Paciente | Nutri |
|---|---|---|
| `GET /messages` | Sin parámetros | `?patientId=` |
| `GET /messages/conversations` | — (`403`) | Sin parámetros |
| `GET /messages/unread-count` | Sin parámetros | Sin parámetros |
| `POST /messages` | `body`, `subject?` | `patientId`, `body`, `subject?` |
| `PUT /messages/read` | Sin parámetros | `?patientId=` |

El orden es del más viejo al más nuevo. Para saber de quién es cada mensaje, comparar `sender._id` con `user.id`, o usar `sender.role`. La hora sale de `createdAt`. Llamar a `PUT /messages/read` al abrir la conversación.

### 5.9 Catálogo SMAE

Ambos roles.

| Método y ruta | Respuesta |
|---|---|
| `GET /smae/groups` | 19 grupos: `key`, `category`, `name`, `subgroup`, `energyKcal`, `proteinG`, `lipidsG`, `carbohydratesG`, `imageUrl?` |
| `GET /smae/foods?search=&groupKey=&limit=` | Alimentos: `name`, `groupKey`, `suggestedQuantity`, `unit`, nutrientes, `imageUrl` |

- `limit`: 50 por defecto, 200 como máximo.
- **`imageUrl` de un alimento ya resuelve el respaldo:** si no tiene foto trae la de su grupo, y si tampoco hay, `null`. El front solo necesita un placeholder para `null`.

### 5.10 Recetas (solo nutri)

| Método y ruta | Uso |
|---|---|
| `GET /recipes?search=&mealTime=&limit=` | Compartidas y propias |
| `GET /recipes/:id` | Detalle |
| `POST /recipes` | Crear |
| `PUT /recipes/:id` | Editar. Solo cambia lo que se manda |
| `DELETE /recipes/:id` | Borrar |
| `POST /recipes/:id/image` | `FormData` con el campo `image` |

```json
{
  "name": "Tacos de pollo con nopales",
  "mealTimes": ["lunch", "dinner"],
  "prepMinutes": 20,
  "ingredients": [
    { "food": "<_id opcional del alimento>", "name": "Nopal cocido", "groupKey": "vegetables", "equivalents": 1, "quantity": 1, "unit": "pieza" }
  ],
  "steps": ["Corta el nopal en tiras.", "Caliéntalo por 2 minutos."]
}
```

- Se necesita al menos un ingrediente, cada uno con `groupKey` y `equivalents`, y al menos un paso.
- **Compartidas:** `nutritionist` es `null`. Solo se usan; editarlas o borrarlas responde `404`, así que hay que ocultar esos botones.
- **La imagen se sube después de crear la receta.** Acepta JPG, PNG o WebP, de al menos 600x450 píxeles y máximo 10 MB. El servidor la deja en 800x600 WebP, recortada al centro, así que conviene avisar que se recorta en proporción 4:3.

### 5.11 Planes alimenticios

| Método y ruta | Quién | Respuesta o nota |
|---|---|---|
| `GET /meal-plans/active` | Ambos | Nutri con `?patientId=`. `404` si no hay plan: mostrar estado vacío, no error |
| `GET /meal-plans?patientId=` | Nutri | Lista sin el menú |
| `GET /meal-plans/:id` | Nutri | Plan completo |
| `POST /meal-plans` | Nutri | Crea v1 y desactiva el plan anterior |
| `PUT /meal-plans/:id` | Nutri | Solo el plan activo. Sube la versión; mandar `reason` |
| `GET /meal-plans/:id/history` | Nutri | `{ currentVersion, history }` |
| `GET /meal-plans/:id/history/:version` | Nutri | `{ version, reason, modifiedAt, previous, current }` |

```json
{
  "patientId": "<id>",
  "name": "Plan de reducción",
  "targetKcal": 1900,
  "waterLiters": 2.4,
  "notes": "Recomendaciones generales",
  "distribution": [
    { "mealTime": "lunch", "equivalents": [{ "groupKey": "cereals-no-fat", "quantity": 2 }] }
  ],
  "menu": [
    {
      "day": "monday",
      "meals": [
        {
          "mealTime": "lunch",
          "title": "Tacos de pollo con nopales",
          "recipe": "<_id de la receta>",
          "imageUrl": "/images/recipes/tacos.webp",
          "foods": [{ "food": "<_id>", "name": "Tortilla de maíz", "groupKey": "cereals-no-fat", "equivalents": 2, "quantity": 2, "unit": "pieza" }],
          "steps": ["Calienta las tortillas."],
          "preparation": "Texto libre, para comidas sin receta"
        }
      ]
    }
  ]
}
```

**Al asignar una receta, el front copia al plan** `name` como `title`, `_id` como `recipe`, `imageUrl`, `ingredients` como `foods` y `steps`. Así se pueden ajustar las porciones para ese paciente, y borrar la receta no afecta al plan. No hay que pedir la receta otra vez para mostrarla: el paciente no tiene acceso a `/recipes`.

Los 7 días son opcionales, y un día puede tener solo algunas comidas.

**Cálculos en el front:**

- **Kcal de un plan o comida:** suma de `equivalents` por el `energyKcal` del grupo, tomado de `/smae/groups`.
- **Contador:** equivalentes del menú contra `distribution`. Avisa, pero no bloquea.
- **Equivalentes de un ingrediente:** `GET /smae/foods?groupKey=` con el `groupKey` del ingrediente.

### 5.12 Reportes (solo nutri)

| Método y ruta | Respuesta |
|---|---|
| `GET /reports/patient-follow-up` | Lista: `firstName`, `paternalLastName`, `maternalLastName`, `email`, `totalConsultations`, `lastConsultation`, `nextAppointment`, `daysSinceLastConsultation`, `needsFollowUp`, `currentWeightKg`, `weightGoalKg` |
| `GET /reports/weight-progress?days=90` | `{ days, patients: [{ firstName, paternalLastName, initialWeightKg, currentWeightKg, totalMeasurements, changeKg, changePct }] }` |
| `GET /reports/wellness-by-condition?days=30` | `{ days, conditions: [{ condition, patientsCount, totalSurveys, avgMood, avgSleepHours, avgWaterGlasses, avgActivityMinutes, avgPlanAdherence }] }` |
| `GET /reports/top-foods` | Lista de hasta 10: `food`, `groupKey`, `groupName`, `subgroup`, `timesUsed`, `plansCount` |

Un paciente sin consultas trae `lastConsultation` y `daysSinceLastConsultation` en `null`.

El peso de `patient-follow-up` (`currentWeightKg`) y de `weight-progress` sale de las mediciones **y** de las consultas, como en `/dashboard/progress`. En `weight-progress`, `totalMeasurements` cuenta todos esos registros.

---

## 6. Reglas que el front debe respetar

1. **Ids:** el usuario de login, registro y `/auth/me` trae `id`. Todo lo demás trae `_id`. Los ids son texto, no números.
2. **Fechas sin hora** (encuestas y mediciones): el back las guarda a las 00:00 UTC. Mostrarlas en UTC, o en México aparecen un día antes. Al mandarlas, usar la fecha **local** en `AAAA-MM-DD`, nunca `new Date().toISOString()`.
3. **Fechas con hora** (citas y mensajes): mandarlas en ISO y mostrarlas en la hora local.
4. **Reemplazos completos:** `PUT /measurements/:id` necesita todos los campos, incluida la fecha. Los objetos anidados de la historia clínica y del onboarding (`identification`, `pathologicalHistory`…) se reemplazan completos, al igual que `menu` y `distribution` del plan. Lo que no se mande se borra.
5. **Ediciones parciales:** `PUT /auth/me`, `PUT /patients/:id`, `PUT /appointments/:id` y `PUT /recipes/:id` solo cambian los campos que se mandan.
6. **Una encuesta por día:** la segunda del mismo día responde `409`.
7. **Paciente sin plan:** `GET /meal-plans/active` responde `404` si el paciente no tiene plan. Es un estado vacío, no un error.
8. **Recetas en el plan:** al asignar una receta, el front copia al plan su `name` (como `title`), su `_id` (como `recipe`), `imageUrl`, sus `ingredients` (como `foods`) y sus `steps`. El paciente no puede consultar `/recipes`: todo lo que ve está en su plan.
9. **Descarga de documentos:** con `downloadFile` de `src/api/client.js`, nunca con un `<a href>`, porque el enlace no manda el token. El nombre del archivo sale de `originalName`.
10. **Imágenes:** formato JPG, PNG o WebP, de al menos 600x450 (fotos de perfil: 200x200). El back las recorta a 800x600 (perfil: 400x400) y las convierte a WebP.
11. **Calorías:** el front las calcula como la suma de los equivalentes por el `energyKcal` del grupo, que viene en `GET /smae/groups`.
12. **Mensajes:** no hay tiempo real. Se recargan al abrir la conversación y después de enviar.

---

## 7. Lo que el back no tiene

No lo inventes ni lo simules con datos de prueba:

- Mensajes en tiempo real ni un estado "en línea".
- Cuestionarios psicológico y alimenticio: solo existe la encuesta diaria de cinco preguntas.
- Registro de comidas marcadas una por una: el cumplimiento sale de `planAdherence` en la encuesta.
- Horario de cada comida: los horarios son fijos en el front.
- Sexo ni fecha de nacimiento del nutriólogo.
- Plantillas de plan alimenticio (para repetir comidas, el constructor tiene "Copiar día").

---

## 8. Variables de entorno

En el `.env` del back (hay un ejemplo en `.env.example`):

| Variable | Para qué |
|---|---|
| `PORT` | Puerto de la API (3000) |
| `MONGODB_URI` | Conexión a MongoDB |
| `CLIENT_URL` | Origen del front permitido por CORS (`http://localhost:5173`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del token (8 h por defecto) |
| `EMAIL_USER`, `EMAIL_APP_PASSWORD` | Cuenta de Gmail y contraseña de aplicación para los correos |
| `SHOW_TEST_CREDENTIALS` | **Solo para pruebas.** En `true`, imprime en la terminal (con el prefijo `[PRUEBAS]`) el correo y la contraseña o el código en: registro de nutriólogo, alta y reenvío de acceso de pacientes, cambio y recuperación de contraseña, y onboarding completado. **Debe quedar en `false` para entregar** |

