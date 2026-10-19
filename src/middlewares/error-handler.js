// Global error handler
import { HttpError } from '../utils/http-error.js'

export const errorHandler = (error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message })
  }

  // Falla de dato en mongoose 
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => item.message)
    return res.status(400).json({ message: 'Hay datos inválidos', details })
  }

  // Id en mongoose sin formato
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `El valor de "${error.path}" no es válido` })
  }

  // Existe algun valor duplicado
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'valor'
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` })
  }

  // Error de archivos
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo pesa más de 10 MB' })
    }
    return res.status(400).json({ message: 'Hubo un problema al subir el archivo' })
  }

  // JSON del cuerpo mal formateado
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' })
  }

  console.error(error)
  res.status(500).json({ message: 'Error interno del servidor' })
}