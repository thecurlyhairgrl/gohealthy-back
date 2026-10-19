import { sendEmail, buildEmailHtml } from './mailer.js'
export const sendWelcomeEmail = async (user, temporaryPassword) => {
    const html = buildEmailHtml(
        `¡Hola, ${user.firstName}!`,
        `
 <p>Tu nutriólogo creó tu cuenta en GoHealthy.</p>
 <p>
 <strong>Correo:</strong> ${user.email}<br>
 <strong>Contraseña temporal:</strong> ${temporaryPassword}
 </p>
 <p>La primera vez que inicies sesión te pediremos cambiar tu contraseña.
</p>
 `
    )
    await sendEmail({ to: user.email, subject: 'Bienvenido a GoHealthy', html })
}
export const sendPasswordResetCode = async (user, code) => {
    const html = buildEmailHtml(
        'Recupera tu contraseña',
        `
 <p>Hola, ${user.firstName}. Tu código para recuperar tu contraseña es:
</p>
 <p style="font-size: 28px; font-weight: bold; letter-spacing:
6px;">${code}</p>
<p>Este código vence en 10 minutos. Si tú no lo pediste, ignora este
correo.</p>
 `
    )
    await sendEmail({
        to: user.email, subject: 'Código para recuperar tu contraseña', html
    })
}
export const sendPasswordChangedEmail = async (user) => {
    const html = buildEmailHtml(
        'Tu contraseña cambió',
        `
 <p>Hola, ${user.firstName}. Te avisamos que la contraseña de tu cuenta se
cambió correctamente.</p>
 <p>Si no fuiste tú, contacta a tu nutriólogo de inmediato.</p>
 `
    )
    await sendEmail({ to: user.email, subject: 'Tu contraseña cambió', html })
}