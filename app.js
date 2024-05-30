const express = require('express');
const app = express();
const secretKey = '21342';
const algorithm = 'HS256';
const expiresIn = '8640000000';
const cors = require('cors')

const jwt = require('jsonwebtoken');
const jwtAuth = (req, res, next) => {
  let [authType, token] = req.headers.authorization?.split(' ') || [];
  const payload = (authType === 'Bearer')
    ? jwt.verify(token, secretKey)
    : undefined;
  if(!payload){
    return res.send('Unauthorized');
  }
  res.locals.teacherId = payload.id;
  next();
}

app.use(cors({
  origin: "http://localhost:3000"
}));

const mysql = require('mysql2/promise');
db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'damn',
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());


//注册
app.post('/teachers/register', async (req, res) => {
  const {user_name, password } = req.body;
  await db.execute(`
    INSERT INTO teacher(user_name,password)
    VALUES(?, ?)
  `, [user_name, password]);
  res;json({code:0})
});


//登陆
app.post('/teacher/login', async (req, res) => {
  const { user_name, password } = req.body;
  let [teacher] = await db.execute(`
    SELECT id
    FROM teacher
    WHERE user_name=? AND password=?
  `, [user_name, password])
  if (teacher.length === 0) {
    return res.send('Wrong username or password');
  }
  res.send({
    token: jwt.sign({ id: teacher[0].id }, secretKey, { algorithm, expiresIn })
  });
});


//获取课程
app.get('/courses', jwtAuth, async(req, res) => {
  const teacherId = res.locals.teacherId;
  const [courses] = await db.execute(`
    SELECT id, name
    FROM course
    WHERE teacher_id = ? AND is_deleted = 0
  `, [teacherId]);
  res.json(courses);
});


//添加课程
app.post('/courses', jwtAuth, async (req, res) =>{
  const teacherId = res.locals.teacherId;
  const { name: courseName } = req.body;
  await db.execute(`
    INSERT INTO course(name, teacher_id)
    VALUES(?, ?)
  `, [courseName, teacherId]);
  res.json({ code: 0 });
})


//删除课程
app.delete('/courses/:courseId', jwtAuth, async (req, res) => {
  const courseId = req.params.courseId;
  await db.execute(`
    UPDATE course
    SET is_deleted = 1
    WHERE id = ?
  `, [courseId]);
  res.json({ code: 0 });
});

//获取学生
app.get('/courses/:courseId/students', jwtAuth, async (req, res) => {
  const { courseId } = req.params;
})
app.listen(5050, () => console.log('Server is running on port 5050'));