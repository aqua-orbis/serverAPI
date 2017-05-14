var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var mongooseUniqueValidator = require('mongoose-unique-validator');

var contractSchema = new Schema({
    contratocod:   { type: String },
    data:   [{}]
});

contractSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('contractModel', contractSchema);
