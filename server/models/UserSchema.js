var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        username: {type: String, required: true, max: 100},
        password: {type: String, required: true, max: 100},
        // You need brackets around a type to make it an array
        todo: [{type: String}],
    }
);

//Export model
module.exports = mongoose.model('user2', UserSchema);
