var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    mongoose = require('mongoose');

var morgan = require('morgan');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file

mongoose.Promise = global.Promise;
// Connection to DB
mongoose.connect(config.database, function(err, res) {
    if (err) throw err;
    console.log('Connected to Database');
});
app.set('superSecret', config.secret); // secret variable

// Middlewares
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(methodOverride());

// use morgan to log requests to the console
app.use(morgan('dev'));



var userMdl = require('./models/userModel')(app, mongoose);
var userCtrl = require('./controllers/userController');
var deviceMdl = require('./models/deviceModel')(app, mongoose);
var deviceCtrl = require('./controllers/deviceController');
var registerMdl = require('./models/registerModel')(app, mongoose);
var registerCtrl = require('./controllers/registerController');
var publicationMdl = require('./models/publicationModel')(app, mongoose);
var publicationCtrl = require('./controllers/publicationController');
var contractMdl = require('./models/contractModel')(app, mongoose);
var contractCtrl = require('./controllers/contractController');

//CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Access-Token");
    next();
});


// API routes ------------------------------------------------------
var apiRoutes = express.Router();

apiRoutes.route('/login')
    .post(userCtrl.login);
apiRoutes.route('/adminlogin')
    .post(userCtrl.adminlogin);
apiRoutes.route('/signup')
    .post(userCtrl.signup);

apiRoutes.route('/users')
    .get(userCtrl.getAllUsers);
apiRoutes.route('/users/id/:userid')
    .get(userCtrl.getUserById);


apiRoutes.route('/devices/id/:deviceid/login')
    .post(deviceCtrl.deviceLogin);

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.send(204, {
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                //console.log("decoded " + decoded);
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(204).send({
            success: false,
            message: 'No token provided.'
        });

    }
}); //fi verificació de token

//user routes

apiRoutes.route('/users/devices')
    .get(userCtrl.getAllUsersWithDevices);
apiRoutes.route('/users/follow/:userid')
    .post(userCtrl.followUser);
apiRoutes.route('/users/unfollow/:userid')
    .post(userCtrl.unfollowUser);
apiRoutes.route('/users/whoisfollowingtheuser/:userid')
    .get(userCtrl.getWhoIsFollowingTheUserId);

//device routes
apiRoutes.route('/devices')
    .get(deviceCtrl.getAllDevices)
    .post(deviceCtrl.addDevice);
apiRoutes.route('/devices/id/:deviceid')
    .get(deviceCtrl.getDeviceById)
    .delete(deviceCtrl.deleteDevice);

apiRoutes.route('/users/id/:userid/devices')
    .get(deviceCtrl.getAllDevicesByUser);

apiRoutes.route('/mydevices')
    .get(deviceCtrl.getMyDevices);

//register routes
apiRoutes.route('/registers')
    .get(registerCtrl.getAllRegisters);
apiRoutes.route('/registers/id/:registerid')
    .get(registerCtrl.getRegisterById);

apiRoutes.route('/devices/id/:deviceid/registers')
    .post(registerCtrl.addRegister);
apiRoutes.route('/devices/id/:deviceid/registers/id/:registerid')
    .delete(registerCtrl.deleteRegister);


//publication routes
apiRoutes.route('/newsfeed')
    .get(publicationCtrl.getNewsFeed);
apiRoutes.route('/publications/user/id/:userid')
    .get(publicationCtrl.getAllPublicationsByUser);
apiRoutes.route('/publications')
    .post(publicationCtrl.addPublication);

apiRoutes.route('/publications/like/id/:publicationid')
    .post(publicationCtrl.likePublication);
apiRoutes.route('/publications/unlike/id/:publicationid')
    .post(publicationCtrl.unlikePublication);

//contract routes

apiRoutes.route('/contracts/contractcod/:contractcod')
    .get(contractCtrl.getContractByContractcod);

app.use('/api', apiRoutes);
// end of API routes -------------------------------------

// Start server
app.listen(config.port, function() {
    console.log("Node server running on http://localhost:3000");
});
