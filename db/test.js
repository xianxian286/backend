const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'damn'
});

const sql = ''

connection.query(sql, (error, result) => {
  console.log(result);
});

connection.end();