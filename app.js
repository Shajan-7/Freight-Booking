//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let mess = "";
let user = "";
let mess1="";
let pickup1, drop1, date1, ton1, booking_id, km=0, truckn, tno, pricet, tph, amount1, tamount,dname,dphone,gst=0,flag=0;
const aboutContent = "A freight booking site is our online platform that allows you to schedule and book transportation for the cargo or freight. This site typically allows users to compare rates and services from different carriers, track their shipments in real-time, and manage their bookings and invoicing.";

// Connect to MongoDB
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/trailtruckDB', { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {

    const bookingSchema = new mongoose.Schema({
        truckname: {
            type: String,
            required: true
        },
        truckno: {
            type: String,
            required: true
        },
        currentlocation: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        ptype: {
            type: String,
            required: true
        },
        tphone: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            default: "free"
        },
        drname: {
            type: String,
            required: true
        },
        drphone: {
            type: Number,
            required: true
        }
    });
    const Booking = mongoose.model("Booking", bookingSchema);

    const bookedSchema = new mongoose.Schema({
        truckname: {
            type: String,
            required: true
        },
        truckno: {
            type: String,
            required: true
        },
        pickup: {
            type: String,
            required: true
        },
        drop: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        ptype: {
            type: String,
            required: true
        },
        pickupdate: {
            type: Date,
            required: true
        },
        ton: {
            type: Number,
            required: true
        },
        tphone: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        totalamount: {
            type: Number,
            reuired: true
        },
        distance: {
            type: String,
            required: true
        },
        drname: {
            type: String,
            required: true
        },
        drphone: {
            type: Number,
            required: true
        }
    });
    const Booked = mongoose.model("Booked", bookedSchema);

    const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        profilename: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        bookings: [bookedSchema]
    });

    // Create a user model
    const User = mongoose.model("User", userSchema);


    passport.use(new LocalStrategy(
        function(username, password, done) {
          User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (user.password != password) { return done(null, false); }
            return done(null, user);
          });
        }
      ));
    
      passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
      passport.deserializeUser(function(id, done) {
        User.findById(id, function (err, user) {
          done(err, user);
        });
      });



    app.use(
        session({ secret: "secret", resave: false, saveUninitialized: true })
    );


    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/", function (req, res) {
        res.render("home",{flag:flag});
    });

    app.get("/profile", function (req,res){
        if (req.session.loggedIn) {

            flag=1;
            mess = "";
            User.findOne({ username: req.user.username }, function (err, docs) {
                if (err) return console.error(err);
                user = docs.username;
                //console.log(docs);
                if (docs.username == "admin") {
                    Booking.find({}, function (err, docs1) {
                        res.render("profile", { docs1: docs1, docs: docs, flag:flag });

                    });
                }
                else {
                    //console.log(docs.bookings);
                    res.render("user", { docs: docs, bookings: docs.bookings, flag:flag});
                }

            });
        } else {
            flag=0;
            res.render("login", { mess: mess, flag:flag });
        }
    });

    app.post("/update", function (req, res) {
        if (req.session.loggedIn) {
            flag = 1;
            Booking.findByIdAndUpdate(
                req.body.id,
                {
                    $set: {
                        truckname: req.body.truckname, 
                        truckno: req.body.truckno,
                        currentlocation: req.body.location,
                        price: req.body.price,
                        ptype: req.body.ptype,
                        tphone: req.body.tphone,
                        status: req.body.status,
                        drname: req.body.drname,
                        drphone: req.body.drphone,
                    },
                },
                function (err, docs2) {
                    if (err) return handleError(err);
                    res.redirect("/profile");
                }
            );
        } else {
            flag = 0;
            res.redirect("/login", { mess: mess, flag: flag });
        }
    });

    app.post("/add", function (req, res) {
        if (req.session.loggedIn) {
            flag=1;
            const booking = new Booking({
                truckname: req.body.truckname,
                truckno: req.body.truckno,
                currentlocation: req.body.location,
                price: req.body.price,
                ptype: req.body.ptype,
                tphone: req.body.tphone,
                drname: req.body.drname,
                drphone: req.body.drphone   
            });
            booking.save(function (error) {
                if (error) {
                    console.error(error);
                    res.send("Error while saving user");
                } else {
                    res.redirect("/profile");
                }
            });
        } else {
            flag=0;
            res.redirect("/login", { mess: mess ,flag:flag});
        }
    });

    app.get("/login", function (req, res) {
        flag=0;
        res.render("login", { mess: mess, flag:flag });
    });


    app.post('/login', passport.authenticate('local', {
        failureRedirect: '/login-error'
    }),function(req,res) {
        flag=1;
        req.session.loggedIn = true;
        res.redirect("/profile");
    });

    app.get('/logout', function (req, res) {
        req.session.loggedIn = false;
        //flag=0;
        res.redirect('/login');
      });

    app.get('/login-error', function (req, res) {

        flag=0;
        mess = "Invalid username or password"
        res.render('login', { mess: mess, flag:flag });
    });

    app.get("/booking", function (req, res) {
        if (req.session.loggedIn) {
            flag=1;
            mess1="";
            res.render("booking",{mess1: mess1, flag:flag});
        } else {
            flag=0;
            mess = "Need to login first!";
            res.render("login", { mess: mess, flag:flag });
        }
    });

    

    app.post("/available-trucks", function (req, res) {
        if (req.session.loggedIn) {

            flag=1;
            Booking.find({ currentlocation: req.body.pickup, status: "free" }, function (err, docs) {
                if (err) return console.error(err);
                pickup1 = req.body.pickup;
                drop1 = req.body.drop;
                date1 = req.body.date;
                ton1 = req.body.ton;
                //console.log(pickup1==drop1);
                if(pickup1==drop1){
                    mess1="Pickup and Drop location cannot be the not be same!";
                    res.render("booking",{mess1: mess1, flag:flag});        
                }
                else{
                    const location=["Chennai","Tirunelveli","Salem","Madurai","Tenkasi","Kanyakumari"];
                    const distance=[200,230,150,100,180];
                    let x,y;
                    for(let i=0;i<location.length;i++){
                        if(location[i]===pickup1){
                            x=i;
                        }
                        if(location[i]===drop1){
                            y=i;
                        }
                    }
                    if(x>y){
                        for(let i=y;i<x;i++){
                            km+=distance[i];
                        }
                    }
                    else{
                        for(let i=x;i<y;i++){
                            km+=distance[i];
                        }
                    }

                    res.render("available-trucks", { docs: docs ,flag:flag});
                }
                
            });
        } else {
            flag=0;
            mess = "Need to login first!";
            res.render("login", { mess: mess, flag:flag });
        }
    });

    app.post("/details",function (req, res){
        if(req.session.loggedIn){
            flag=1; 
            User.findOne({ username: req.user.username }, function (err, docs) {
                if (err) return console.error(err);
                Booking.findOne({ truckno: req.body.truckno}, function (err, docs1) {
                    if (err) return console.error(err);
                    
                    truckn= req.body.truckname;
                    //console.log(truckn);
                    tno= req.body.truckno;
                    pricet= req.body.price;
                    prtype=req.body.ptype;
                    tph= req.body.tphone;
                    booking_id= req.body.id;
                    dname=req.body.drname;
                    dphone=req.body.drphone;
    
                    if(prtype=="per ton"){
                        amount1=pricet*ton1;
                        gst=amount1*20/100;
                        tamount=amount1+amount1*20/100;
                    }
                    if(prtype=="per km"){
                        amount1=pricet*km;
                        gst=amount1*20/100;
                        tamount=amount1+amount1*20/100;
                    }
                    res.render("details", { docs: docs, docs1: docs1, pickup:pickup1, drop:drop1, ton:ton1, amount:amount1, gst:gst, totalamount:tamount, km:km, flag:flag});
                    // res.render("details", { docs: docs});
                });
                
            });
        }
        else {
            flag=0;
            mess = "Need to login first!";
            res.render("login", { mess: mess, flag:flag });
        }
    });

    app.post("/done", function (req, res) {
        if (req.session.loggedIn) {
            flag=0;
            User.findOne({ username: req.user.username }, function (err, docs) {
                if (err) return console.error(err);
            //Create a new booking
            const newBooking = new Booked({
                truckname: truckn,
                truckno: tno,
                pickup: pickup1,
                drop: drop1,
                price: pricet,
                ptype: prtype,
                pickupdate: date1,
                ton: ton1,
                tphone: tph,
                distance: km,
                amount: amount1,
                totalamount: tamount,
                drname: dname,
                drphone: dphone,
            });

            // Find the user and update their bookings array
            User.findOneAndUpdate(
                { username: user },
                { $push: { bookings: newBooking } },
                { new: true },
                function (error, user) {
                    if (error) {
                        console.log(error);
                    }
                }
            );
            Booking.findByIdAndUpdate(
                booking_id,
                { $set: { currentlocation: drop1, status:"booked"} },
                function (err, docs2) {
                    if (err) return handleError(err);
                    //res.redirect("/");
                }
            );
            // res.render("home", { docs: docs, bookings: docs.bookings });
            res.redirect("/profile");
            });
        } else {
            flag=0;
            mess = "Need to login first!";
            res.render("login", { mess: mess, flag:flag });
        }

    });


    app.post("/billing", function(req,res){
        if (req.session.loggedIn) {
            flag=1;
            User.findOne({ username: req.user.username }, function (err, docs) {
                if (err) return console.error(err);
                const bookingId=req.body._id;
                const bookings = docs.bookings.id(bookingId);
                gst=bookings.amount*20/100;
                res.render("billing", { docs: docs, docs1: bookings, gst:gst, flag:flag});
            });
        } else {
            flag=0;
            mess = "Need to login first!";
            res.render("login", { mess: mess, flag:flag });
        }
    });

    app.get("/about", function (req, res) {
        //flag=0;
        res.render("about", { aboutContent: aboutContent, flag:flag });
    });

    app.get("/signup", function (req, res) {
        flag=0;
        const err="";
        res.render("signup",{err: err, flag:flag});
    });

    app.post("/signup", (req, res) => {
        //flag=0;
        const pass = req.body.password;
        const curpass = req.body.currentpassword;
        const username = req.body.username;

        User.findOne({ username: username }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }
            if (user) {
                flag = 0;
                // If the user already exists, show an alert message

                const err = "'Username already exists'";
                res.render("signup", { err: err, flag: flag });
            } 
            else if (pass == curpass) {
                // Create a new user
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    username: req.body.username,
                    profilename: req.body.profilename,
                    password: req.body.password,
                });

                // Save the user to the database
                newUser.save((err) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    mess = "Signup done! please login.";
                    res.render("login", { mess: mess, flag: flag });
                });
            } 
            else {
                flag = 0;
                const err = "password and confirm password should me same!";
                res.render("signup", { err: err, flag: flag });
            }
        });
    });

    app.get("/login", function (req, res) {
        flag=0;
        res.render("login", { mess: mess, falg:flag });
    });

    app.listen(3000, function () {
        console.log('Server started on http://localhost:3000');
    });
});