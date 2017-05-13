const TelegramBot = require('node-telegram-bot-api');


var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var crypto = require('crypto');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// Connection to DB
mongoose.connect(config.database, function(err, res) {
    if (err) throw err;
    console.log('Connected to Database');
});

var userMdl = require('../models/userModel')(app, mongoose);
var userCtrl = require('../controllers/userController');
var deviceMdl = require('../models/deviceModel')(app, mongoose);
var deviceCtrl = require('../controllers/deviceController');
var registerMdl = require('../models/registerModel')(app, mongoose);
var registerCtrl = require('../controllers/registerController');


var userModel = mongoose.model('userModel');
var deviceModel = mongoose.model('deviceModel');
var registerModel = mongoose.model('registerModel');

var configTelegram = require('./configTelegram.json');

var tBot = require('./mongoPetitions');

// replace the value below with the Telegram token you receive from @BotFather
const token = configTelegram.token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
/*
// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});*/

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  var command = msg.text.split(" ")[0];
  console.log(command);
  switch(command) {
        case "/login":
            var email = msg.text.split(" ")[1];
            var password = msg.text.split(" ")[2];
            var resp = tBot.login(bot, chatId, email, password);
            //bot.sendMessage(chatId, resp);
            break;
        default:
            console.log("default");
            bot.sendMessage(chatId, "command wrong");
    }
});
