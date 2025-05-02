const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const ValidationError = require('../utils/error')

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs', { title: 1, author: 1, url: 1, likes: 1 })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if (username.length < 3) {
    throw new ValidationError('username must be 3 or more characters long');
  }
  if (password.length < 3) {
    throw new ValidationError('password must be 3 or more characters long');
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter