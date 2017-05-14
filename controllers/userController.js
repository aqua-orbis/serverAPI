var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var crypto = require('crypto');
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');

var pageSize = config.pageSize;

exports.signup = function(req, res) {
    var user = new userModel({
        username: req.body.username,
        password: crypto.createHash('sha256').update(req.body.password).digest('base64'),
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        email: req.body.email,
        numPeople: req.body.numPeople
    });

    user.save(function(err, user) {
        if (err) return res.status(500).send(err.message);
        //res.status(200).jsonp(user); en comptes de retoranr la data del signup, fem el login directament
        console.log("signup fet correctament, redirigint al login internament automàtic");
        exports.login(req, res);
    });
};


exports.login = function(req, res) {
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
                            os: req.body.os,
                            browser: req.body.browser,
                            device: req.body.device,
                            os_version: req.body.os_version,
                            browser_version: req.body.browser_version,
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
exports.adminlogin = function(req, res) {
    if (req.body.email == "admin@water.com") {
        exports.login(req, res);
    }
};

exports.getAllUsers = function(req, res) {
    userModel.find()
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .exec(function(err, users) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(users);
        });
};

exports.getAllUsersWithDevices = function(req, res) {
    userModel.find()
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .lean()
        .populate('following', 'username img')
        .populate('devices', 'name description icon date registers')
        .exec(function(err, users) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(users);
        });
};

exports.getUserById = function(req, res) {
    userModel.findOne({
            _id: req.params.userid
        })
        .lean()
        .populate('devices', 'name description icon date registers')
        .exec(function(err, user) {
            if (err) return res.send(500, err.message);
            if (!user) {
                res.json({
                    success: false,
                    message: 'User not found.'
                });
            } else if (user) {

                res.status(200).jsonp(user);
            }
        });
};

exports.getWhoIsFollowingTheUserId = function(req, res) {
    console.log(req.params.userid);
    userModel.find({
            following: req.params.userid
        })
        .exec(function(err, users) {
            if (err) return res.send(500, err.message);
            if (!users) {
                res.json({
                    success: false,
                    message: 'User not found.'
                });
            } else if (users) {
                res.status(200).jsonp(users);
            }
        });
};

exports.followUser = function(req, res) {
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
                userModel.findOne({
                        '_id': req.params.userid
                    })
                    .exec(function(err, userB) {
                        if (!userB) {
                            console.log("userb not found");
                            res.json({
                                success: false,
                                message: 'userb not found.'
                            });
                        } else if (userB) {
                            var exists = false;
                            for (var i = 0; i < user.following.length; i++) {
                                if (user.following[i].equals(userB._id)) {
                                    exists = true;
                                }
                            }
                            if (exists == false) {
                                user.following.push(userB._id);
                            }
                            user.save(function(err, user) {
                                if (err) return res.send(500, err.message);

                                res.status(200).jsonp(user);
                            }); //end of userB.save
                        }
                    }); //end of deviceModel.find
            }
        }); //end of usermodel.find
};

exports.unfollowUser = function(req, res) {
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
                userModel.findOne({
                        '_id': req.params.userid
                    })
                    .exec(function(err, userB) {
                        if (!userB) {
                            console.log("userb not found");
                            res.json({
                                success: false,
                                message: 'userb not found.'
                            });
                        } else if (userB) {
                            for (var i = 0; i < user.following.length; i++) {
                                if (user.following[i].equals(userB._id)) {
                                    user.following.splice(i, 1);
                                }
                            }
                            user.save(function(err, user) {
                                if (err) return res.send(500, err.message);

                                res.status(200).jsonp(user);
                            }); //end of userB.save
                        }
                    }); //end of deviceModel.find
            }
        }); //end of usermodel.find
};
