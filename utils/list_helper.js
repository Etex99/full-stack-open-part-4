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

module.exports = {
  dummy,
  totalLikes
}