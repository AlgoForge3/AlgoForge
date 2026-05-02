const mongoose = require('mongoose');
require('dotenv').config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');
    
    const User = require('./models/User');
    const Submission = require('./models/Submission');
    
    const users = await User.find({}).lean();
    console.log('Users:', users.map(u => ({ id: u._id, name: u.name, username: u.username })));
    
    const subs = await Submission.find({}).lean();
    console.log('Submissions:', subs.length);
    if (subs.length > 0) {
        console.log('Sample sub:', subs[0]);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
