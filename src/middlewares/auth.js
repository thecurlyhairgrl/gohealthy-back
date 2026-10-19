import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const authenticate = (req, res, next) => {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
        return next(new HttpError(401, 'Debes iniciar sesión'))
    }

    const token = header.split(' ')[1]

    try {
        const payload = jwt.verify(token, env.jwtSecret)
        req.user = { id: payload.id, role: payload.role }
        next()
    } catch {
        next(new HttpError(401, 'Tu sesión expiró o no es válida. Inicia sesión de nuevo'))
    }
}

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new HttpError(403, 'No tienes permiso para esta acción'))
        }
        next()
    }
}