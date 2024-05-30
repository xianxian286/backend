const teacherRouter = require('./teacher')
// const courseRouter = require('./course')

module.exports = app => {
  app.use('/teacher', teacherRouter)
//   app.use('/course', courseRouter)
}