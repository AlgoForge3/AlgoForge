const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const users = await User.find({username: {$exists: false}});
    for (let u of users) {
        let base = (u.name || u.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
        if(base.length<3) base+='user';
        let uname = base;
        let c=1;
        while(await User.findOne({username: uname})) {
            uname = base+c;
            c++;
        }
        u.username = uname;
        await u.save();
        console.log('Updated', u.email, 'to', uname);
    }
    console.log('Done');
    process.exit(0);
}).catch(console.error);
