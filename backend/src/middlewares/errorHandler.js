const errorHandler = (err, req, res, next) => {
  // O pino-http já faz o log do erro se ele for passado para o next()
  req.log.error(err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Erro interno do servidor'

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
}

module.exports = errorHandler
