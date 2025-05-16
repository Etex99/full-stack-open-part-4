const assert = require('node:assert')
const { test, describe, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const User = require('../models/user')
const blog = require('../models/blog')

const api = supertest(app)
let tokenForRoot = null
let tokenForDummy = null

beforeEach(async () => {
  await helper.resetTestUsers()

  if (tokenForRoot === null) {
    const result = await api
      .post('/api/login')
      .send({
        username: helper.initialUsers[0].username,
        password: helper.initialUsers[0].password
      })
    tokenForRoot = result.body.token
  }
  if (tokenForDummy === null) {
    const result = await api
      .post('/api/login')
      .send({
        username: helper.initialUsers[1].username,
        password: helper.initialUsers[1].password
      })
    tokenForDummy = result.body.token
  }
  await helper.resetTestBlogs()
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
    const blogsBefore = await helper.blogsInDb()

    let newBlog = {
      title: 'blog of root',
      author: 'test',
      url: 'test',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfter = await helper.blogsInDb()

    const addedBlog = blogsAfter.find(blog => blog.title === 'blog of root')

    assert.strictEqual(blogsAfter.length, blogsBefore.length + 1)
    assert(addedBlog !== null)
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
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()
    const addedBlog = blogs.find(blog => blog.title === newBlog.title)

    assert.strictEqual(blogs.length, helper.initialBlogs.length + 1)
    assert.strictEqual(addedBlog.likes, 0)
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

    let result

    result = await api
      .post('/api/blogs')
      .send(badBlog)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(400)

    assert(result.body.error.includes('`title` is required'))

    result = await api
      .post('/api/blogs')
      .send(alsoBadBlog)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(400)

    assert(result.body.error.includes('`url` is required'))
  })
  test('server responds with status 401 when making a post request without a token', async () => {
    const result = await api
      .post('/api/blogs')
      .send( {} )
      .expect(401)
    assert(result.body.error.includes('token invalid'))
  })
})

describe('deleting blogs', async () => {
  test('a blog that exists within the database is deleted by its creator', async () => {
    const blogsBeforeDelete = await helper.blogsInDb()

    await api
      .delete(`/api/blogs/${helper.initialBlogs[0]._id}`)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(204)

    const blogsAfterDelete = await helper.blogsInDb()
    const deletedBlog = blogsAfterDelete.find(blog => blog.title === helper.initialBlogs[0].title)

    assert.strictEqual(blogsAfterDelete.length, blogsBeforeDelete.length - 1)
    assert(deletedBlog === undefined)
  })
  test('user cannot delete blog of someone else', async () => {
    const blogsBeforeDelete = await helper.blogsInDb()

    const result = await api
      .delete(`/api/blogs/${helper.initialBlogs[0]._id}`)
      .set({ Authorization: `Bearer ${tokenForDummy}` })
      .expect(401)

    const blogsAfterDelete = await helper.blogsInDb()

    assert.strictEqual(blogsAfterDelete.length, blogsBeforeDelete.length)

    assert(result.body.error.includes('cannot delete blog of someone else'))
  })

  test('trying to delete a blog that does not exist makes no changes to db and is responded with 204', async () => {
    const blogsBeforeDelete = await helper.blogsInDb()
    const dumbId = '000000000000000000000000'

    await api
      .delete(`/api/blogs/${dumbId}`)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(204)

    const blogsAfterDelete = await helper.blogsInDb()

    assert.strictEqual(blogsBeforeDelete.length, blogsAfterDelete.length)
  })

  test('delete request with malformatted id is responded with 400', async () => {
    await api
      .delete(`/api/blogs/not-a-valid-id`)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(400)
  })
})

describe('updating blogs', async () => {
  test('a blog that exists within the database is updated by its owner', async () => {
    const blogsBeforeUpdate = await helper.blogsInDb()
    
    const blogToUpdate = blogsBeforeUpdate[0]
    const updateFields = {
      likes: 8
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateFields)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAfterUpdate = await helper.blogsInDb()
    const updatedBlog = blogsAfterUpdate.find(blog => blog.id === blogToUpdate.id)

    assert.strictEqual(blogsBeforeUpdate.length, blogsAfterUpdate.length)
    assert.deepStrictEqual(blogToUpdate.user, updatedBlog.user)
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
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(200)

    const blogsAfterUpdate = await helper.blogsInDb()

    assert.deepStrictEqual(blogsBeforeUpdate, blogsAfterUpdate)
  })

  test('update request with malformatted id is responded with 400', async () => {
    await api
      .delete(`/api/blogs/not-a-valid-id`)
      .set({ Authorization: `Bearer ${tokenForRoot}` })
      .expect(400)
  })
})

after(async () => {
  await mongoose.connection.close()
})