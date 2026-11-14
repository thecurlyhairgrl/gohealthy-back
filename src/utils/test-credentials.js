import { env } from '../config/env.js'

// Solo para pruebas: con SHOW_TEST_CREDENTIALS=true imprime en la terminal
// el correo y la contraseña (o el código) en texto claro, para entrar con correos que no existen.
// Antes de entregar el proyecto, la variable debe quedar en false
export const logTestCredentials = (action, data) => {
    if (!env.showTestCredentials) {
        return
    }

    const details = Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
    console.log(`[PRUEBAS] ${action} -> ${details}`)
}
