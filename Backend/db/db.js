const mongoose = require('mongoose');


function connectToDb() {
    return mongoose.connect(process.env.DB_CONNECT
    ).then(() => {
        console.log('Connected to DB');
    }).catch(err => {
        console.log(err);
        throw err;
    });
}


module.exports = connectToDb;