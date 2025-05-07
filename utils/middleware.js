const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  switch (error.name) {
    case 'CastError':
      return response.status(400).send({ error: 'malformatted id' })
    case 'ValidationError':
      return response.status(400).json({ error: error.message })
    case 'SyntaxError':
      return response.status(400).json({ error: 'malformatted json' })
    case 'MongoServerError':
      if (error.message.includes('E11000 duplicate key error')) return response.status(400).json({ error: 'expected `username` to be unique' })
      break
    case 'JsonWebTokenError':
      return response.status(401).json({ error: 'token invalid' })
    case 'TokenExpiredError':
      return response.status(401).json({ error: 'token expired' })
  }
  next(error)
}
const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

const tokenExtractor = (request, response, next) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  request.token = decodedToken
  next()
}

const userExtractor = async (request, response, next) => {
  const user = await User.findById(request.token.id)
  request.user = user
  next()
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor
}