var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');
var deviceModel = mongoose.model('deviceModel');
var registerModel = mongoose.model('registerModel');

var pageSize = config.pageSize;


exports.getAllRegisters = function(req, res) {
    registerModel.find()
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .exec(function(err, registers) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(registers);
        });
};

exports.getRegisterById = function(req, res) {
    registerModel.findOne({
            _id: req.params.registerid
        })
        .lean()
        .exec(function(err, register) {
            if (err) return res.send(500, err.message);
            if (!register) {
                res.json({
                    success: false,
                    message: 'register not found.'
                });
            } else if (register) {

                res.status(200).jsonp(register);
            }
        });
};


exports.addRegister = function(req, res) {
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
                deviceModel.findOne({
                        '_id': req.body.deviceid
                    })
                    .exec(function(err, device) {
                        if (!device) {
                            console.log("device not found");
                            res.json({
                                success: false,
                                message: 'device not found.'
                            });
                        } else if (device) {
                            var register = new registerModel({
                                date: req.body.date,
                                value: req.body.value
                            });

                            register.save(function(err, register) {
                                if (err) return res.send(500, err.message);
                                device.registers.push(register._id);
                                device.save(function(err, device) {
                                    if (err) return res.send(500, err.message);
                                    res.status(200).jsonp(register);
                                }); //end of device.save
                            }); //end of register.save
                        }
                    }); //end of deviceModel.find
            }
        }); //end of usermodel.find
};

exports.deleteRegister = function(req, res) {
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
                registerModel.findOne({
                        _id: req.params.registerid,
                        user: user._id
                    })
                    .exec(function(err, register) {
                        if (err) return res.send(500, err.message);
                        if (register.user.equals(user._id)) {
                            register.remove(function(err) {
                                if (err) return res.send(500, err.message);

                                console.log("deleted");
                                exports.getAllRegisters(req, res);
                            });
                        }
                    });
            }
        });
};
