const assert = require('node:assert')
const { test, describe, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

describe('blogs router tests', async () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('blog unique identifier is named \'id\'', async () => {
    const blogs = await helper.blogsInDb()
    assert(Object.keys(blogs[0]).includes('id'))
  })

  test('all blogs are returned', async () => {
    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, 2)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const titles = response.body.map(e => e.title)
    assert(titles.includes('Go To Statement Considered Harmful'))
  })

  test('a valid blog post is successfully created', async () => {
    let newBlog = {
      title: 'test',
      author: 'test',
      url: 'test',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()
    const addedBlog = blogs.find(blog => blog.title === 'test')
    delete addedBlog.id

    assert.strictEqual(blogs.length, helper.initialBlogs.length + 1)
    assert.deepStrictEqual(newBlog, addedBlog)
  })

  test('likes in an added post default to 0', async () => {
    let newBlog = {
      title: 'no',
      author: 'likes',
      url: 'defined'
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()
    const addedBlog = blogs.find(blog => blog.title === 'no')

    delete addedBlog.id
    Object.assign(newBlog, { likes: 0 })

    assert.strictEqual(blogs.length, helper.initialBlogs.length + 1)
    assert.deepStrictEqual(newBlog, addedBlog)
  })

  test('posts with missing title or url are responded with 400', async () => {
    const badBlog = {
      author: 'no',
      url: 'title'
    }
    const alsoBadBlog = {
      title: 'no',
      author: 'url'
    }

    await api
      .post('/api/blogs')
      .send(badBlog)
      .expect(400)

    await api
      .post('/api/blogs')
      .send(alsoBadBlog)
      .expect(400)
  })
  
  after(async () => {
    await mongoose.connection.close()
  })
})
