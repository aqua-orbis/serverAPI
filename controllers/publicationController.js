var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var crypto = require('crypto');
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');
var publicationModel = mongoose.model('publicationModel');

var pageSize = config.pageSize;


exports.getAllPublications = function(req, res) {
    publicationModel.find()
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
        .lean()
        .exec(function(err, publications) {
            if (err) return res.send(500, err.message);
            res.status(200).jsonp(publications);
        });
};

var ObjectId = require('mongodb').ObjectID;
exports.getNewsFeed = function(req, res) {
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
                console.log("getting newsfeed for user: " + user.name);

                var following = [];
                for (var i = 0; i < user.following.length; i++) {//això ho fem perquè necessitem la array amb el contingut en format objectid
                    following.push(new ObjectId(user.following[i]));
                }
                following.push(new ObjectId(user._id));//així també reb les seves pròpies publicacions

                publicationModel.find({user: {$in: following}})
                    .lean()
                    .populate('user', 'name avatar')
                    .exec(function (err, publications) {
                        if (err) return res.send(500, err.message);
                        if (!publications) {
                            //
                        } else if (publications) {
                            res.status(200).jsonp(publications);
                        }
                    });
            }
        });
};

exports.addPublication = function(req, res) {
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
                var publication = new publicationModel({
                    content: req.body.content,
                    img: req.body.img,
                    date: new Date(),
                    user: user._id
                });

                publication.save(function(err, publication) {
                    if (err) return res.send(500, err.message);

                    user.publications.push(publication._id);
                    user.save(function(err, user) {
                        if (err) return res.send(500, err.message);
                        res.status(200).jsonp(publication);
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
