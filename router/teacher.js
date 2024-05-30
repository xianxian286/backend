const express = require('express');
const router = express.Router();
const { setToken } = require('../middleware/auth');

const db = require('../db');

router.get('/', (req, res) => {
    db.query('SELECT * FROM `teacher`')
        .then(result => res.send(result[0]))
});

router.post('/', async (req, res) => {
  const { user_name, password } = req.body;

  let [user] = await db.execute(
    'SELECT * FROM `teacher` WHERE `user_name`=? AND `password`=?',
    [user_name, password]
  )
  if (user.length > 0) {
    res.send({ code: 0, token: setToken({ id: user[0].id }) });
  } else {
    res.send('Incorrect username or password');
  }
});
// router.get('/:id', (req, res) => {
//   const teacherId = req.params.id;
//   res.send(teacherId + 1);
// });



module.exports = router;