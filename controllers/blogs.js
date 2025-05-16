const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const { userExtractor, tokenExtractor } = require('../utils/middleware')
const jwt = require('jsonwebtoken')
const usersRouter = require('./users')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', tokenExtractor, userExtractor, async (request, response, next) => {
  const { body, token, user } = request

  const blog = new Blog({
    title: body.title,
    url: body.url,
    user: token.id
  })
  if (body.author) blog.author = body.author
  if (body.likes) blog.likes = body.likes

  try {
    const result = await blog.save()
    user.blogs = user.blogs.concat(result._id)
    await user.save()

    response.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

blogsRouter.delete('/:id', tokenExtractor, userExtractor, async (request, response, next) => {
  const { token, user } = request

  try {
    const blogToDelete = await Blog.findById(request.params.id)

    if (blogToDelete === null) response.status(204).end()

    if (blogToDelete.user.toString() !== user._id.toString()) {
      return response.status(401).json({
        error: 'cannot delete blog of someone else'
      })
    }

    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

blogsRouter.put('/:id', tokenExtractor, userExtractor, async (request, response, next) => {
  const { body } = request

  try {
    const blog = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
      user: body.user
    }
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true, runValidators: true, context: 'query' })
    response.json(updatedBlog)
    
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter