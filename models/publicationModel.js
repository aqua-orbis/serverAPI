var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var mongooseUniqueValidator = require('mongoose-unique-validator');

var publicationSchema = new Schema({
    content:   { type: String, required: true },
    img:   { type: String },
    date:   { type: Date, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    }]
});

publicationSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('publicationModel', publicationSchema);
