import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import { env } from '../config/env.js'
import { sendPasswordResetCode, sendPasswordChangedEmail } from '../emails/account-emails.js'

const SALT_ROUNDS = 10
const MIN_PASSWORD_LENGTH = 8
const OTP_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5

const createToken = (user) => {
    return jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn,
    })
}

const toPublicUser = (user) => {
    return {
        id: user._id,
        firstName: user.firstName,
        paternalLastName: user.paternalLastName,
        maternalLastName: user.maternalLastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        onboardingCompleted: user.onboardingCompleted,
    }
}

const isValidPassword = (password) => {
    return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH
}

const findUserWithValidCode = async (email, code) => {
    if (!email || !code) {
        throw new HttpError(400, 'Escribe tu correo y el código')
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim(), active: true }).select(
        '+passwordHash +passwordReset'
    )

    if (!user || !user.passwordReset || !user.passwordReset.otpHash) {
        throw new HttpError(400, 'El código no es válido. Solicita uno nuevo')
    }

    if (user.passwordReset.expiresAt < new Date()) {
        throw new HttpError(400, 'El código ya venció. Solicita uno nuevo')
    }

    if (user.passwordReset.attempts >= OTP_MAX_ATTEMPTS) {
        throw new HttpError(400, 'Demasiados intentos. Solicita un código nuevo')
    }

    const codeMatches = await bcrypt.compare(String(code), user.passwordReset.otpHash)

    if (!codeMatches) {
        user.passwordReset.attempts = user.passwordReset.attempts + 1
        await user.save()
        throw new HttpError(400, 'El código no es correcto')
    }

    return user
}

export const register = async (req, res, next) => {
    try {
        const { firstName, paternalLastName, maternalLastName, email, password, phone, professionalLicense } = req.body

        if (!isValidPassword(password)) {
            throw new HttpError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

        const user = await User.create({
            firstName,
            paternalLastName,
            maternalLastName,
            email,
            phone,
            professionalLicense,
            passwordHash,
            role: 'nutritionist',
        })

        res.status(201).json({ token: createToken(user), user: toPublicUser(user) })
    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            throw new HttpError(400, 'Escribe tu correo y tu contraseña')
        }

        const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash')

        if (!user) {
            throw new HttpError(401, 'Correo o contraseña incorrectos')
        }

        const passwordMatches = await bcrypt.compare(String(password), user.passwordHash)

        if (!passwordMatches) {
            throw new HttpError(401, 'Correo o contraseña incorrectos')
        }

        if (!user.active) {
            throw new HttpError(403, 'Tu cuenta está desactivada. Contacta a tu nutriólogo')
        }

        res.json({ token: createToken(user), user: toPublicUser(user) })
    } catch (error) {
        next(error)
    }
}

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            throw new HttpError(404, 'Usuario no encontrado')
        }

        res.json(toPublicUser(user))
    } catch (error) {
        next(error)
    }
}

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword) {
            throw new HttpError(400, 'Escribe tu contraseña actual')
        }

        if (!isValidPassword(newPassword)) {
            throw new HttpError(400, `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
        }

        const user = await User.findById(req.user.id).select('+passwordHash')

        if (!user) {
            throw new HttpError(404, 'Usuario no encontrado')
        }

        const passwordMatches = await bcrypt.compare(String(currentPassword), user.passwordHash)

        if (!passwordMatches) {
            throw new HttpError(400, 'La contraseña actual no es correcta')
        }

        user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
        user.mustChangePassword = false
        await user.save()

        try {
            await sendPasswordChangedEmail(user)
        } catch (error) {
            console.error('No se pudo enviar el aviso de cambio de contraseña:', error.message)
        }

        res.json({ message: 'Contraseña actualizada' })
    } catch (error) {
        next(error)
    }
}

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            throw new HttpError(400, 'Escribe tu correo')
        }

        const user = await User.findOne({ email: String(email).toLowerCase().trim(), active: true }).select(
            '+passwordReset'
        )

        if (user) {
            const code = crypto.randomInt(100000, 1000000).toString()

            user.passwordReset = {
                otpHash: await bcrypt.hash(code, SALT_ROUNDS),
                expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
                attempts: 0,
            }
            await user.save()

            try {
                await sendPasswordResetCode(user, code)
            } catch (error) {
                console.error('No se pudo enviar el código de recuperación:', error.message)
            }
        }

        res.json({ message: 'Si el correo está registrado, te enviamos un código de verificación' })
    } catch (error) {
        next(error)
    }
}

export const verifyOtp = async (req, res, next) => {
    try {
        await findUserWithValidCode(req.body.email, req.body.code)
        res.json({ message: 'Código correcto' })
    } catch (error) {
        next(error)
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        const { email, code, newPassword } = req.body

        if (!isValidPassword(newPassword)) {
            throw new HttpError(400, `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
        }

        const user = await findUserWithValidCode(email, code)

        user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
        user.passwordReset = undefined
        user.mustChangePassword = false
        await user.save()

        try {
            await sendPasswordChangedEmail(user)
        } catch (error) {
            console.error('No se pudo enviar el aviso de cambio de contraseña:', error.message)
        }

        res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión' })
    } catch (error) {
        next(error)
    }
}