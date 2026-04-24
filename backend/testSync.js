const { syncLeetcodeProblems } = require('./controllers/leetcodeController');
const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  const fakeReq = { body: { slugs: ['valid-parentheses'] } };
  const fakeRes = { 
    status: (s) => ({ json: (j) => console.log(s, j) }), 
    json: (j) => console.log('json:', j) 
  };
  
  try {
    await syncLeetcodeProblems(fakeReq, fakeRes);
  } catch (err) {
    console.error('Crash in sync:', err);
  }
  process.exit(0);
};

run();
