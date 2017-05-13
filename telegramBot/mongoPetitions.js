var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var crypto = require('crypto');
var mongoose = require('mongoose');

var userModel = mongoose.model('userModel');

var pageSize = config.pageSize;


exports.login = function(bot, chatId, email, password) {
    var msgReturn;

    userModel.findOne({
            email: email
        })
        .select('+password')
        .exec(function(err, user) {
            if (err) throw err;
            if (!user) {
                msgReturn = 'Authentication failed. User not found.';
                bot.sendMessage(chatId, msgReturn);
            } else if (user) {
                password = crypto.createHash('sha256').update(password).digest('base64');
                if (user.password != password) {
                    msgReturn = 'Authentication failed. Wrong password.';
                    bot.sendMessage(chatId, msgReturn);
                } else {
                    var indexToken = -1;
                    for (var i = 0; i < user.tokens.length; i++) {
                        if (user.tokens[i].userAgent == "telegramBot") {
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
                            userAgent: "telegramBot",
                            token: tokenGenerated,
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
                        user.tokens[indexToken].lastLogin = Date();
                    }
                    user.save(function(err, user) {
                        console.log("asdf");
                        if (err) {
                            msgReturn = "no saved";
                        }
                        // return the information including token as JSON
                        user.password = "";
                        /*res.json({
                            user: user,
                            success: true,
                            message: 'Enjoy your token!',
                            token: tokenGenerated
                        });*/
                        //msgReturn= user.username + " logged";
                        msgReturn = user.username + " logged";
                        bot.sendMessage(chatId, msgReturn);
                    });
                }
            }
        });
};


exports.getUserByUsername = function(username) {
    userModel.findOne({
            username: username
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
                msgReturn = user.username + ":\n";
                msgReturn += user.username + ":\n";
                bot.sendMessage(chatId, msgReturn);
            }
        });
};
