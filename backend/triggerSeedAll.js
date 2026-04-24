const axios = require('axios');
axios.post('http://localhost:5000/api/problems/seed-all')
    .then(res => console.log(res.data))
    .catch(err => console.error(err.message));
