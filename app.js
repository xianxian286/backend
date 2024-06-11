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
  res.json({ code: 1 });
});

//获取学生
app.get('/courses/:courseId/students', jwtAuth, async (req, res) => {
  const { courseId } = req.params;
  const [students] = await db.execute(`
    SELECT id, name
    FROM student
    WHERE course_id = ? AND is_deleted = 0
  `, [courseId]);
  res.json(students);
});

//添加学生
app.post('/courses/:courseId/students', jwtAuth, async (req, res) => {
  const { name: studentName } = req.body;
  const { courseId } = req.params;
  await db.execute(`
    INSERT INTO student(name, course_id)
    VALUES(?, ?)
  `, [studentName, courseId]);
  res.json({ code: 3 });
});


//删除学生
app.use('/courses/:courseId/students/:studentId', jwtAuth, async (req, res) => {
  const { studentId } = req.params;
  await db.execute(`
    UPDATE student
    SET is_deleted = 1
    WHERE id = ? AND is_deleted = 0
  `, [studentId]);
  res.json({ code: 10 })
})


//添加课时(untested)
app.post('/courses/:courseId/classes', jwtAuth, async (req, res, next) => {
  const { courseId } = req.params;
  const { timestamp } = req.body;
  const date = new Date(timestamp).setHours(0, 0, 0, 0);
  const session = new Date(timestamp).getHours < 12 ? 0 : 1
  await db.execute(`
    INSERT INTO class(course_id, date, session)
    VALUES(?, ?, ?)
  `, [courseId, date, session]);
  res.json({ code: 5 })
})

//获取课程的所有异常考勤(untested)
app.get('/couses/:couseId/attendances', jwtAuth, async (req, res) => {
  const { courseId } = req.params;
  const [attendances] = await db.execute(`
    SELECT stu.name, cls.date, cls.session, att.status
    FROM attendance att
    JOIN student stu ON stu.id = attstudent_id
    JOIN class cls ON cls.id = att.class_id
    WHERE att.course_id = ? AND att.status != 0
    ORDER BY cls.date, cls.session
  `, [courseId]);
  res.json(attendances);
});

// 获取一节课的考勤(untested)
app.get('/courses/:courseId/attendances/classes/:classId',
  jwtAuth,
  async (req, res) => {
  const { classId } = req.params;
  const [attendances] = await db.execute(`
  SELECT student_id, status
  FROM attendance
  WHERE class_id = ?`, [classId]);
  res.json(attendances);
  });

//添加考勤记录
app.post('/courses/:courseId/attendances/classes/:classId/students/:studentId', jwtAuth, async(req, res) => {
  const { courseId, classId, studentId } = req.params;
  const { status } = req.body;
  await db.execute(`
  INSERT INTO attendance(course_id, class_id, student_id, status)
  VALUES(?, ?, ?, ?)
  `, [courseId, classId, studentId, status]);
  res.json({ code: 6 })
})

//修改考勤记录
app.patch('courses/:courseId/attendances/classes/:classId/students/:studentId', jwtAuth, async (req, res) => {
  const { classId, studentId } = req.params;
  const { status } = req.body;
  await db.execute(`
  UPDATE attendance
  SET status = ?
  WHERE student_id = ? AND class_id = ?
  `, [status, studentId, classId]);
  res.json({ code: 7});
})

// 获取课程的所有得分纪录
app.get('/courses/:courseId/scores', jwtAuth, async (req, res) => {
  const { courseId } = req. params;
  const [scores] = await db. execute(`
  SELECT stu.name, cls.date, cls.session, sc.score
  FROM score sc
  JOIN student stu ON stu. id = sc. student_id
  JOIN class cls ON cls. id = sc. class_id
  WHERE sc.course_id = ?
  ORDER BY cls. date, cls.session `, [courseId]
);
res.json(scores);
});

// 获取一节课的所有学生的得分纪录
app.get('/courses/:courseId/scores/classes/:classId', jwtAuth,
async (req, res) => {
const { classId } = req.params;
const [scores] = await db.execute(`
SELECT student_id, score
FROM score
WHERE class_id = ?
`, [classId]
);
res.json (scores);
});

//添加积分记录
app.post('/courses/:courseId/scores/classes/:classId/students/:studentId', jwtAuth, async (req, res) => {
  const { score } = req.body;
  const {courseId, classId, studentId } = req.params;
  await db.execute(`
  INSERT INTO score(course_id, class_id, student_id, score)
  VALUES(?, ?, ?, ?)
  `, [courseId, classId, studentId, score]);
  res.json({ code: 8 });
});

//修改积分记录
app.patch('couses/:courseId/scores/classes/:classId/students/:studentId', jwtAuth, async (req, res) => {
  const { classId, studentId } = req.params;
  const { score } = req.body;
  await db.execute(`
  UPDATE score
  SET score = ?
  WHERE student_id = ? AND class_id = ?
  `, [score, studentId, classId]);
  res.json({ code: 9 });
});
app.listen(5050, () => console.log('Server is running on port 5050'));