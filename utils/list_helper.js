const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const likes = blogs.map(obj => obj.likes)
  let initial = 0
  const sum = likes.reduce(
    (accumulator, current) => accumulator + current, initial
  )
  return sum
}

const favoriteBlog = (blogs) => {
  let mostLikes = 0
  let favorite = {}
  blogs.forEach(obj => {
    if (obj.likes > mostLikes) {
      favorite = obj
      mostLikes = obj.likes
    }
  })
  return favorite
}

const groupBy = require('lodash/groupby')
const foreach = require('lodash/foreach')
const isEmpty = require('lodash/isempty')

const mostBlogs = (blogs) => {
  const authors = groupBy(blogs, 'author')

  if (isEmpty(authors)) return {}

  let out = { author: '', blogs: -1 }
  foreach(authors, (value, key) => {
    if (value.length > out.blogs) {
      out.author = key
      out.blogs = value.length
    }
  })
  return out
}

const mostLikes = (blogs) => {
  const authors = groupBy(blogs, 'author')

  if (isEmpty(authors)) return {}

  let out = { author: '', likes: -1 }

  foreach(authors, (value, key) => {
    let sum = value.reduce((sum, n) => { return sum + n.likes }, 0)
    if (sum > out.likes) {
      out.author = key
      out.likes = sum
    }
  })

  return out
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}