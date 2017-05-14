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


exports.getAllPublicationsByUser = function(req, res) {
    publicationModel.find({
            user: req.params.userid
        })
        .lean()
        .populate('user', 'username img')
        .limit(Number(req.query.pageSize))
        .skip(pageSize * Number(req.query.page))
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
                    .populate('user', 'username img')
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

exports.likePublication = function(req, res) {
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
                publicationModel.findOne({
                        _id: req.params.publicationid
                    })
                    .exec(function(err, publication) {
                        if (err) return res.send(500, err.message);
                        if (!publication) {
                            res.json({
                                success: false,
                                message: 'publication not found.'
                            });
                        } else if (publication) {
                            console.log(publication);
                            var exists = false;
                            for(var i=0; i<publication.likes.length; i++)
                            {
                                if(publication.likes[i].equals(user._id)){
                                    exists = true;
                                }
                            }
                            if(exists==false){
                                publication.likes.push(user._id);
                            }

                            publication.save(function(err, publication) {
                                if (err) return res.send(500, err.message);
                                res.status(200).jsonp(publication);
                            }); //end of device.save
                        }
                    });
            }
        }); //end of usermodel.find
};
exports.unlikePublication = function(req, res) {
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
                publicationModel.findOne({
                        _id: req.params.publicationid
                    })
                    .exec(function(err, publication) {
                        if (err) return res.send(500, err.message);
                        if (!publication) {
                            res.json({
                                success: false,
                                message: 'publication not found.'
                            });
                        } else if (publication) {
                            for(var i=0; i<publication.likes.length; i++)
                            {
                                if(publication.likes[i].equals(user._id)){
                                    publication.likes.splice(i, 1);
                                }
                            }
                            publication.save(function(err, publication) {
                                if (err) return res.send(500, err.message);
                                res.status(200).jsonp(publication);
                            }); //end of device.save
                        }
                    });
            }
        }); //end of usermodel.find
};
