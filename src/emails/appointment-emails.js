import { sendEmail, buildEmailHtml } from './mailer.js'

const formatDate = (date) => {
    return new Date(date).toLocaleString('es-MX', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City',
    })
}

export const sendAppointmentScheduledEmail = async (patient, appointment) => {
    const html = buildEmailHtml(
        'Tienes una nueva cita',
        `
 <p>Hola, ${patient.firstName}. Tu nutriólogo agendó una cita para el:</p>
 <p style="font-size: 18px;"><strong>${formatDate(appointment.dateTime)}
</strong></p>
 <p>Puedes ver tus citas dentro de GoHealthy.</p>
 `
    )
    await sendEmail({
        to: patient.email, subject: 'Nueva cita en GoHealthy', html
    })
}
export const sendAppointmentRescheduledEmail = async (patient, appointment) => {
    const html = buildEmailHtml(
        'Tu cita cambió de fecha',
        `
 <p>Hola, ${patient.firstName}. Tu cita se reprogramó para el:</p>
 <p style="font-size: 18px;"><strong>${formatDate(appointment.dateTime)}
</strong></p>
 `
    )
    await sendEmail({
        to: patient.email, subject: 'Tu cita fue reprogramada',
        html
    })
}
export const sendAppointmentCancelledEmail = async (patient, appointment) => {
    const html = buildEmailHtml(
        'Tu cita fue cancelada',
        `
 <p>Hola, ${patient.firstName}. Tu cita del
<strong>${formatDate(appointment.dateTime)}</strong> fue cancelada.</p>
 <p>Si tienes dudas, escríbele a tu nutriólogo desde la sección de
mensajes.</p>
 `
    )
    await sendEmail({
        to: patient.email, subject: 'Tu cita fue cancelada', html
    })
}
