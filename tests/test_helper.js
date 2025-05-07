const { initial } = require('lodash')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0,
    user: '5a422aa71b54a676234d1337'
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0,
    user: '5a422aa71b54a67623331337'
  }
]

const initialUsers = [
  {
    username: 'root',
    password: 'sekret',
    _id: '5a422aa71b54a676234d1337'
  },
  {
    username: 'dummy',
    password: 'password',
    _id: '5a422aa71b54a67623331337'
  }
]

const resetTestUsers = async () => {
  await User.deleteMany({})
  let hash, user

  for (const elem of initialUsers) {
    hash = await bcrypt.hash(elem.password, 10)
    user = new User({ username: elem.username, passwordHash: hash, _id: elem._id})
    await user.save()
  }
}

const resetTestBlogs = async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = { initialBlogs, initialUsers, resetTestUsers, resetTestBlogs, blogsInDb, usersInDb }