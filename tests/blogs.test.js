const assert = require('node:assert')
const { test, describe, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('getting already saved blogs', async () => {
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
})

describe('saving blogs', async () => {
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
})

describe('deleting blogs', async () => {
  test('a blog that exists within the database is deleted', async () => {
    const blogsBeforeDelete = await helper.blogsInDb()
    const blogToDelete = blogsBeforeDelete[0]
    
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    let blogsAfterDelete = await helper.blogsInDb()
    ids = blogsAfterDelete.map(blog => blog.id)

    assert.strictEqual(blogsAfterDelete.length, blogsBeforeDelete.length - 1)
    assert(!ids.includes(blogToDelete.id))
  })

  test('trying to delete a blog that does not exist makes no changes to db and is responded with 204', async () => {
    const blogsBeforeDelete = await helper.blogsInDb()
    const dumbId = '000000000000000000000000'
    
    await api
      .delete(`/api/blogs/${dumbId}`)
      .expect(204)

    const blogsAfterDelete = await helper.blogsInDb()

    assert.strictEqual(blogsBeforeDelete.length, blogsAfterDelete.length)
  })

  test('delete request with malformatted id is responded with 400', async () => {
    await api
      .delete(`/api/blogs/not-a-valid-id`)
      .expect(400)
  })
})

describe('updating blogs', async () => {
  test('a blog that exists within the database is updated', async () => {
    const blogsBeforeUpdate = await helper.blogsInDb()
    const blogToUpdate = blogsBeforeUpdate[0]
    const updateFields = {
      likes: 8
    }
    
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateFields)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAfterUpdate = await helper.blogsInDb()
    const updatedBlog = blogsAfterUpdate.find(blog => blog.id === blogToUpdate.id)

    assert.strictEqual(blogsBeforeUpdate.length, blogsAfterUpdate.length)
    assert(blogToUpdate.title === updatedBlog.title)
    assert(blogToUpdate.author === updatedBlog.author)
    assert(blogToUpdate.url === updatedBlog.url)
    assert(blogToUpdate.id === updatedBlog.id)
    assert.strictEqual(updatedBlog.likes, 8)
  })

  test('trying to update a blog that does not exist makes no changes to db and is responded with 200', async () => {
    const blogsBeforeUpdate = await helper.blogsInDb()
    const dumbId = '000000000000000000000000'
    const body = {
      likes: 1
    }
    
    await api
      .put(`/api/blogs/${dumbId}`)
      .send(body)
      .expect(200)

    const blogsAfterUpdate = await helper.blogsInDb()

    assert.deepStrictEqual(blogsBeforeUpdate, blogsAfterUpdate)
  })

  test('update request with malformatted id is responded with 400', async () => {
    await api
      .delete(`/api/blogs/not-a-valid-id`)
      .expect(400)
  })
})

after(async () => {
  await mongoose.connection.close()
})