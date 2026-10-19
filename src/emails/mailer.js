import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.emailUser,
        pass: env.emailAppPassword,
    },
})
export const sendEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"GoHealthy" <${env.emailUser}>`,
        to,
        subject,
        html,
    })
}
export const buildEmailHtml = (title, content) => {
    return `
 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0
auto; padding: 24px;">
 <h2 style="color: #2e7d32;">${title}</h2>
 ${content}
 <hr style="border: none; border-top: 1px solid #ddd; margin-top: 32px;">
 <p style="color: #888; font-size: 12px;">Este es un correo automático de
GoHealthy. No respondas a este mensaje.</p>
 </div>
 `
}