var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var mongooseUniqueValidator = require('mongoose-unique-validator');

var deviceSchema = new Schema({
    name: { type: String, required: true, unique: true },
    description:   { type: String, required: true },
    icon:   { type: String, default: "img/device.png" },
    date:   { type: Date, required: true },
    registers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerModel'
    }],
    days: [{
        day: { type: String },
        value: { type: String }
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    },
    deviceToken: {
        deviceId: {type: String, select: false},
        token: {type: String, select: false},
        lastLogin: {type: Date, select: false},
        created: {type: Date, select: false}
    },
    maxPerDay: { type: String },
    overPassed: { type: String, default: "false" }
});

deviceSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('deviceModel', deviceSchema);
