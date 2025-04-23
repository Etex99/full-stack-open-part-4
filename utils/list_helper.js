const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const likes = blogs.map(obj => obj.likes)
  let initial = 0;
  const sum = likes.reduce(
    (accumulator, current) => accumulator + current, initial
  )
  return sum
}

const favoriteBlog = (blogs) => {
  let mostLikes = 0
  let favorite = {}
  blogs.map(obj => {
    if (obj.likes > mostLikes) {
      favorite = obj
      mostLikes = obj.likes
    }
  })
  return favorite
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}