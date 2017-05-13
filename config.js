module.exports = {
    /*'secret': process.env.SECRET,// production version
    'database': process.env.MONGO_DSN,*/
    'secret': 'secretfortoken',// local version
    'database': 'mongodb://localhost/waterAPI',
    "port" : process.env.PORT || 3000,
    "pageSize": 20

};
