var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var express = require("express");
var app = express();
var config = require('../config'); // get our config file
app.set('superSecret', config.secret); // secret variable
var mongoose = require('mongoose');

var contractModel = mongoose.model('contractModel');

var pageSize = config.pageSize;



exports.getContractByContractcod = function(req, res) {
    contractModel.findOne({
            contratocod: req.params.contractcod
        })
        .lean()
        .exec(function(err, contract) {
            if (err) return res.send(500, err.message);
            if (!contract) {
                res.json({
                    success: false,
                    message: 'register not found.'
                });
            } else if (contract) {

                res.status(200).jsonp(contract);
            }
        });
};
