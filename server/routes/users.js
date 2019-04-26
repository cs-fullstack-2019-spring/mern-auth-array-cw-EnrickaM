var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var userCollection = require('../models/UserSchema');

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    userCollection.findById(id, function(err, user) {
        done(err, user);
    });
});

var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
};

var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

router.get('/', (req, res, next) => {
    console.log("Home page");
    console.log(req.session);
    console.log(req.session.username);

    if (req.session.username) {
        res.send(req.session.username);
    } else {
        res.send(null);
    }
});


router.get('/logout', (req, res, next) => {
    console.log(req.session);
    // console.log(req.session.username);

    if (req.session) {
        console.log("has session");
        req.session=null;
        res.send("Logged Out");
    } else {
        console.log("Doesn't have session");
        res.send("Not logged in");
    }
});



//******************************************************************
// ***************   Check if a user exists    *********************
//******************************************************************

// This is the "strategy" for checking for an existing user
passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("Local Strat");
        userCollection.findOne({ username: username }, function (err, user) {
            if (err) { console.log("1");
                return done(err); }
            if (!user) {
                console.log("2");
                return done(null, false, { message: 'Incorrect username.' });
            }
            // if (!user.validPassword(password)) {
            if (!isValidPassword(user, password)) {
                console.log("3");
                return done(null, false, { message: 'Incorrect password.' });
            }
            console.log("4");
            console.log(user);
            return done(null, user, { user: user.username });
        });
    }
));

// This is the route to check for new users
router.post('/login',
    passport.authenticate('local',
        {failureRedirect: '/users/loginfail' }),
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.

    function(req, res) {
        // console.log(req.body.user);
        req.session.username=req.body.username;
        console.log("Saving cookie");
        res.send(req.body.username);
    });

// **** I'm not running this right now because I want to use the user data
// If there is a successful check of an existing user
router.get('/loginsuccess', (req, res)=>{
    res.send("Successful Logging in!!!")
});

// If there is a failure check of an existing user
router.get('/loginfail', (req, res)=>{
    res.send(undefined)
});

//******************************************************************
// ***************   Registering / Sign up new User   **************
//******************************************************************

// This is the "strategy" for signing up a new user
passport.use('signup', new LocalStrategy(
    {passReqToCallback : true},
    function(req, username, password, done) {
        console.log("0");
        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            userCollection.findOne({'username':username},function(err, user) {
                // In case of any error return
                if (err){
                    console.log("1");
                    console.log('Error in SignUp: '+err);
                    return done(err);
                }
                // already exists
                if (user) {
                    console.log("2");
                    console.log('User already exists');
                    return done(null, false,
                        // req.flash('message','User Already Exists')
                        { message: 'User already exists.' }
                    );
                } else {
                    console.log("3");
                    // if there is no user with that email
                    // create the user
                    var newUser = new userCollection();
                    // set the user's local credentials
                    newUser.username = username;
                    newUser.password = createHash(password);
                    // newUser.email = req.param('email');
                    // newUser.firstName = req.param('firstName');
                    // newUser.lastName = req.param('lastName');

                    // save the user
                    newUser.save(function(err) {
                        if (err){
                            console.log("4");
                            console.log('Error in Saving user: '+err);
                            throw err;
                        }
                        console.log('User Registration succesful');
                        return done(null, newUser);
                    });
                }
            });
        };

        // Delay the execution of findOrCreateUser and execute
        // the method in the next tick of the event loop
        process.nextTick(findOrCreateUser);
    })
);

// This is the route to create a new user.
router.post('/newuser',
    passport.authenticate('signup',
        { successRedirect: '/users/successNewUser',
            failureRedirect: '/users/failNewUser'
        }
    ),
    function(req, res) {
        console.log("test");
        // If this function gets called, authentication was successful.
        // `req.user` contains the authenticated user.
        res.send('Authenticated!');
    });

// If there is a successful new user
router.get('/successNewUser', (req, res)=>{
    console.log(req.body);
    res.send("Added New User")
});

// If there is a failer of a new user
router.get('/failNewUser', (req, res)=>{
    console.log("Failed New User");
});

// This route looks for a user saved in the cookie data and find that user in your database. It returns the entire results of that user to the client. The results include the to-do list ARRAY.
router.get('/grabToDo', (req, res)=>{
    // finds one user name from the cookie (session) data
    userCollection.findOne({username: req.session.username}, (errors, results)=>{
        // If there are returned results from finding a user, the results are returned to the client (res.send)
        if(results){ return res.send(results); }
        // If there is an error, send an error message to the client
        else{return res.send({message: "Didn't find a user!!!"})}
    })
});

// This is from fetch '/users/addToDo' run from the client side as a post.
router.post('/addToDo', (req,res)=>{
    // Find the user sent in the req.body. Push ($push) the req.body.todoItem into the _todo (ignore the underscore) key to add to the existing array in _todo.
    userCollection.findOneAndUpdate({username: req.body.username},
        {$push: {todo: req.body.todoItem}}, (errors, results)=>{
            // If there was an error send the error
            if(errors) res.send(errors);
            // If it went through send "ADDED!!!"
            else res.send("ADDED!!!");
        });
});

// ******************************************
// ******   How to protect routes   *********
// ******************************************

/* GET Home Page */
// router.get('/home', isAuthenticated, function(req, res){
//     res.render('home', { user: req.user });
// });
//
// // As with any middleware it is quintessential to call next()
// // if the user is authenticated
// var isAuthenticated = function (req, res, next) {
//     if (req.isAuthenticated())
//         return next();
//     res.redirect('/');
// }


module.exports = router;