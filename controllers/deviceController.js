var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var crypto = require('crypto');
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');
var deviceModel = mongoose.model('deviceModel');

var pageSize = config.pageSize;


exports.getAllDevices = function(req, res) {
    deviceModel.find()
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .lean()
        .populate('registers', 'date value')
        .exec(function(err, devices) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(devices);
        });
};

exports.getAllDevicesByUser = function(req, res) {
    deviceModel.find({
            user: req.params.userid
        })
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .lean()
        .populate('registers', 'date value')
        .exec(function(err, devices) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(devices);
        });
};

exports.getMyDevices = function(req, res) {
    userModel.findOne({
            'tokens.token': req.headers['x-access-token']
        })
        .exec(function(err, user) {
            if (err) return res.send(500, err.message);
            if (!user) {
                console.log("user not found");
                res.json({
                    success: false,
                    message: 'User not found.'
                });
            } else if (user) {
                deviceModel.find({
                        'user': user._id
                    })
                    .limit(Number(req.query.pageSize))
                    .skip(pageSize * Number(req.query.page))
                    .lean()
                    .populate('registers', 'date value')
                    .exec(function(err, devices) {
                        if (err) return res.send(500, err.message);
                        res.status(200).jsonp(devices);
                    }); //end of deviceModel.find
            }
        }); //end of usermodel.find
};

exports.getDeviceById = function(req, res) {
    deviceModel.findOne({
            _id: req.params.deviceid
        })
        .lean()
        .populate('registers', 'date value')
        .exec(function(err, device) {
            if (err) return res.send(500, err.message);
            if (!device) {
                res.json({
                    success: false,
                    message: 'device not found.'
                });
            } else if (device) {

                res.status(200).jsonp(device);
            }
        });
};


exports.addDevice = function(req, res) {
    userModel.findOne({
            'tokens.token': req.headers['x-access-token']
        })
        .exec(function(err, user) {
            if (err) return res.send(500, err.message);
            if (!user) {
                console.log("user not found");
                res.json({
                    success: false,
                    message: 'User not found.'
                });
            } else if (user) {
                var device = new deviceModel({
                    name: req.body.name,
                    description: req.body.description,
                    icon: req.body.icon,
                    date: new Date(),
                    user: user._id
                });

                device.save(function(err, device) {
                    if (err) return res.send(500, err.message);

                    user.devices.push(device._id);
                    user.save(function(err, user) {
                        if (err) return res.send(500, err.message);
                        res.status(200).jsonp(device);
                    });
                }); //end of device.save
            }
        }); //end of usermodel.find
};

exports.deleteDevice = function(req, res) {
    userModel.findOne({
            'tokens.token': req.headers['x-access-token']
        })
        .exec(function(err, user) {
            if (err) return res.send(500, err.message);
            deviceModel.findOne({
                    _id: req.params.deviceid,
                    user: user._id
                })
                .exec(function(err, device) {
                    if (err) return res.send(500, err.message);
                    if (device.user.equals(user._id)) {
                        device.remove(function(err) {
                            if (err) return res.send(500, err.message);

                            console.log("deleted");
                            exports.getAllDevices(req, res);
                        });
                    }
                });
        });
};


exports.deviceLogin = function(req, res) {
    userModel.findOne({
            email: req.body.email
        })
        .select('+password')
        .exec(function(err, user) {
            if (err) throw err;
            if (!user) {
                res.json({
                    success: false,
                    message: 'Authentication failed. User not found.'
                });
            } else if (user) {
                req.body.password = crypto.createHash('sha256').update(req.body.password).digest('base64');
                if (user.password != req.body.password) {
                    res.json({
                        success: false,
                        message: 'Authentication failed. Wrong password.'
                    });
                } else {
                    var indexToken = -1;
                    for (var i = 0; i < user.tokens.length; i++) {
                        if (user.tokens[i].userAgent == req.body.userAgent) {
                            indexToken = JSON.parse(JSON.stringify(i)); //stringify i parse pq es faci una còpia de la variable i, enlloc de una referència
                        }
                    }
                    if (indexToken == -1) { //userAgent no exist
                        var tokenGenerated = jwt.sign({
                            foo: 'bar'
                        }, app.get('superSecret'), {
                            //  expiresIn: 86400 // expires in 24 hours
                        });
                        var newToken = {
                            userAgent: req.body.userAgent,
                            token: tokenGenerated,
                            ip: req.body.ip,
                            lastLogin: Date()
                        };
                        user.tokens.push(newToken);
                    } else { //userAgent already exist
                        user.tokens[indexToken].token = "";
                        var tokenGenerated = jwt.sign({
                            foo: 'bar'
                        }, app.get('superSecret'), {
                            //  expiresIn: 86400 // expires in 24 hours
                        });
                        user.tokens[indexToken].token = tokenGenerated;
                        user.tokens[indexToken].ip = req.body.ip;
                        user.tokens[indexToken].lastLogin = Date();
                    }
                    user.save(function(err, user) {
                        if (err) return res.send(500, err.message);
                        // return the information including token as JSON
                        user.password = "";
                        res.json({
                            user: user,
                            success: true,
                            message: 'Enjoy your token!',
                            token: tokenGenerated
                        });
                    });
                }
            }
        });
};
