// Global error handler
export function errorHandler(err, req, res, next) {
  let status = err.status ?? 500

  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400
  if (err.code === 11000) status = 409

  if (status === 500) console.error(err)

  res.status(status).json({
    message: status === 500 ? 'Error interno del servidor' : err.message,
  })
}
