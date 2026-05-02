const axios = require('axios');
axios.post('http://localhost:5000/api/problems/leetcode/sync', {
    slugs: ['two-sum', 'valid-parentheses', 'climbing-stairs', 'merge-two-sorted-lists', 'roman-to-integer']
}).then(res => console.log(res.data)).catch(err => console.error(err.response ? err.response.data : err.message));
