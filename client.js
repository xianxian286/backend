const axios = require('axios');

const api = 'http://localhost:5050/';

axios.get(api).then(res => console.log(res.data));