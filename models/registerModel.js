var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var mongooseUniqueValidator = require('mongoose-unique-validator');

var registerSchema = new Schema({
    date:   { type: Date, required: true },
    value:   { type: String, required: true }
});

registerSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('registerModel', registerSchema);
