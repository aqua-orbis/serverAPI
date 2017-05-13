var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var mongooseUniqueValidator = require('mongoose-unique-validator');

var userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email:   { type: String, required: true },
    password: { type: String, required: true, select: false },
    numPeople:   { type: String },
    tokens: [{
        userAgent: {type: String},
        token: {type: String, select: false},
        os: {type: String, select: false},
        browser: {type: String, select: false},
        device: {type: String, select: false},
        os_version: {type: String, select: false},
        browser_version: {type: String, select: false},
        ip: {type: String, select: false},
        lastLogin: {type: Date, select: false},
        birthdate: {type: Date, select: false},
    }],
    shortDescription:   { type: String },
    description:   { type: String },
    img:   { type: String, default: "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png" },
    contact: {
        twitter:   { type: String },
        facebook:   { type: String },
        telegram:   { type: String },
        web:   { type: String },
        phone: { type: Number }
    },
    location:{
        direction: { type: String },
        city:   { type: String },
        district: { type: String },
        geo: {
            lat: {type: Number},
            long: {type: Number},
            name: { type: String}
        }
    },
    devices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'deviceModel'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    }],
    publications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'publicationModel'
    }]
});

userSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('userModel', userSchema);
