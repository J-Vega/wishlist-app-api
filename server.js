
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const request = require('request-promise');
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {localStrategy,jwtStrategy} = require('./auth/strategies.js');
const authRoute = require('./auth/router.js');

const app = express();
app.use(cors());
app.use(morgan("common"));
app.use(express.static('public'));

passport.use('localAuth',localStrategy);
passport.use('jwtAuth',jwtStrategy);

//Tells express you want to use passport
app.use(passport.initialize());
app.use(bodyParser.json());

// const jwtAuth = passport.authenticate('jwt', { session: false });

const { PORT, DATABASE_URL, TEST_DATABASE_URL} = require('./config');

app.use('/auth',function(req,res,next){ console.log(req.body); next()},authRoute);

//Not yet
const {UserProfiles, UserWishLists, ProductListing} = require('./models');

var ObjectId = require('mongodb').ObjectId;


app.use(function (req, res, next) {
    
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    if(req.method === 'OPTIONS'){

      return res.sendStatus(204);
    }

    // Pass to next layer of middleware
    next();
});



//https://api.walmartlabs.com/v1/search?query=ipod&format=json&apiKey=cwd2qzamfg6f523deuwhuxec

app.get('/api/*', (req, res) => {
	res.json({ok: true});
});

app.get("/Walmart/Listings/", cors(), (req, res, body) => {
	console.log("Running get request from walmart API");
	//console.log(res);
	const query = req.query.searchTerm;
	console.log("Searching for: " + query);
	console.log(req.query.searchTerm);
	console.log(req.params.searchTerm);
	const options = {
		method: 'GET',
		uri: `https://api.walmartlabs.com/v1/search?query=${query}&format=json&apiKey=cwd2qzamfg6f523deuwhuxec&numItems=10`,
	    json: true
	}
	request(options)
	.then(function(response){
      return res.json(response.items);
      
    })
	.catch(function(err){
		console.log("Something went wrong with Walmart search API")
		return res.json(err);
	})
});

app.get("/BestBuy/Listings/", cors(), (req, res, body) => {
	console.log("Running get request from Best Buy API");
	//console.log(res);
	const query = req.query.searchTerm;
	console.log("Searching for: " + query);
	console.log(req.query.searchTerm);
	console.log(req.params.searchTerm);
	const options = {
		method: 'GET',
		uri: `https://api.bestbuy.com/v1/products((search=${query}))?apiKey=vrjst2v5zsgemp3jq44xwmz9&show=bestSellingRank,name,url,regularPrice,shortDescription,longDescription,image&pageSize=12&format=json`,
	    json: true
	}
	request(options)
	.then(function(response){
      return res.json(response.products);
      
    })
	.catch(function(err){
		console.log("Something went wrong with BestBuy search API");
		return res.json(err);
	})
});

app.get("/Etsy/Listings/", cors(), (req, res, body) => {
	console.log("Running get request from Etsy API");
	//console.log(res);
	const query = req.query.searchTerm;
	console.log("Searching for: " + query);
	console.log(req.query.searchTerm);
	console.log(req.params.searchTerm);
	const options = {
		method: 'GET',
		uri: `https://openapi.etsy.com/v2/listings/active/?api_key=oww1hu2f71dd0rs83ba669i5&keywords=${query}&limit=12`,
	    json: true
	}
	request(options)
	.then(function(response){
		//Product is listed under 'results' array
      	return res.json(response.results);
      
    })
	.catch(function(err){
		console.log("Something went wrong with Etsy API");
		return res.json(err);
	})
});

app.get("/Etsy/Listing/Images/", cors(), (req, res, body) => {
	console.log("Running get request from Etsy API");
	//console.log(res);
	const id = req.query.listingId;
	console.log("Searching for images for listing ID: " + id);

	const options = {
		method: 'GET',
		//https://openapi.etsy.com/v2/listings/222392615/images?api_key=oww1hu2f71dd0rs83ba669i5
		uri: `https://openapi.etsy.com/v2/listings/${id}/images?api_key=oww1hu2f71dd0rs83ba669i5`,
	    json: true
	}
	request(options)
	.then(function(response){
		//Product is listed under 'results' array
      	return res.json(response);
      
    })
	.catch(function(err){
		console.log("Something went wrong with Etsy API");
		return res.json(err);
	})
});

app.get("/Users", (req, res) => {

  UserProfiles
    .find()
    .exec() 
    .then(UserProfiles => {
      return res.json(UserProfiles);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    });
});

app.post('/Users', jsonParser, (req, res) => {
  console.log("Registering user.");
	console.log(req.body);
  const requiredFields = ['userName', 'password', 'firstName', 'lastName', 'email'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['userName', 'password', 'firstName', 'lastName', 'email'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  // If the username and password aren't trimmed we give an error.  Users might
  // expect that these will work without trimming (i.e. they want the password
  // "foobar ", including the space at the end).  We need to reject such values
  // explicitly so the users know what's happening, rather than silently
  // trimming them and expecting the user to understand.
  // We'll silently trim the other fields, because they aren't credentials used
  // to log in, so it's less of a problem.
  const explicityTrimmedFields = ['userName', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    userName: {
      min: 1
    },
    password: {
      min: 4,
      // bcrypt truncates after 72 characters
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {userName, password, email = '', firstName = '', lastName = ''} = req.body;
  // Username and password come in pre-trimmed, otherwise we throw an error
  // before this
  firstName = firstName.trim();
  lastName = lastName.trim();
  email = email.trim();
  console.log(userName);
  console.log(lastName);
  console.log(email);
  console.log(firstName);
  console.log(password);
  return UserProfiles.find({userName})
    .countDocuments()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      return UserProfiles.hashPassword(password);
    })
    .then(hash => {
      console.log("Creating profile");
      return UserProfiles.create({
        userName,
        password: hash,
        email,
        firstName,
        lastName
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
      	console.log(err);
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server errorr'});
    });
});

app.get("/profile",(req, res) => {
  res.sendFile(__dirname + "/public/profile.html");
});

app.get("/Wishlist", (req, res) => {

  UserWishLists
    .find()
    .exec() 
    .then(data => {
      return res.json(data);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    });
});

//GET one wishlist by ID
app.get("/Wishlist/:id", cors(), (req, res) => {
  //example for local host on postman - localhost:3001/WishList/5bc9159de7ca5e3acae4cbc1
  UserWishLists
    .findById(req.params.id)
    .exec() 
    .then(data => {
      return res.json(data);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    });
});

//GET all wishlists from one user
app.get("/Wishlist/:userName", cors(), (req, res) => {
  //example for local host on postman - localhost:3001/WishList/?userName=abcd1234
  UserWishLists
    .find({"user":{$elemMatch:{creator:req.params.userName}}})
    .exec()
    .then(data => {    
      console.log("Sucessfully located wishlist by user name.")
      return res.json(data);
    })
    .catch(err => {
      return res.status(500).json({ message: 'Internal server error when finding user wishlist' });
    });
});

app.post("/Wishlist", jsonParser, (req, res) => {
  console.log(req.body);
  const requiredFields = ['user', 'category', 'item', 'imageUrl'];

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  UserWishLists
    .create({
      user: req.body.user,
      category: req.body.category,
      item: req.body.item
    })
    .then(listing => res.status(201).json(listing))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Creating new wishlist failed'});
    });
});

//If the user chooses adds a product to a wish list category that already exists...
// then push item listing into category array
app.put("/Wishlist/:id", jsonParser, (req, res) => {

  // ensure that the id in the request path and the one in request body match
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
        console.error(message);
      return res.status(400).json({ message: message });
  }

  
  const requiredFields = ['name','price', 'link', 'imageUrl'];
  let name = req.body.name;
  let price = req.body.price;
  let link = req.body.link;
  let imageUrl = req.body.imageUrl;

  requiredFields.forEach(field => {
    if(!(field in req.body)){
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  UserWishLists.findByIdAndUpdate(req.params.id, {$push : {"items": req.body }})//{"content":"Comment","created":"JVEGA"}}})//,creator: }})//,{$push: {comments:"This is a comment pushed via mongo shell"}} )//req.params.id,{ $push: {comments:"N"}})
  .then(phoneNumber => res.status(204).end())
  .catch(err => res.status(500).json({ message: err })); 
})

//Delete an entire category
app.delete('/Wishlist/:id', (req, res) => {
  UserWishLists
    .findByIdAndRemove(req.params.id)
    .then(listing => res.status(204).end())
    .catch(err => res.status(500).json({message: "Error deleting listing"}));
});

//Delete a single item from a category
app.delete('/Wishlist/:id/Item/:itemId', (req, res) => {
  console.log("Deleting item from category");
  UserWishLists
    .findByIdAndUpdate(
      req.params.id,
      {$pull:{"items" : {"_id":req.params.itemId}}},
      {"new":true})
    .then(listing => res.status(204).end())
    .catch(err => res.status(500).json({message: "Error deleting listing"}));
});

app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, {useNewUrlParser: true}, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(port, () => {
          resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
};

function closeServer() {
  
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {

  runServer(DATABASE_URL).catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };

console.log("The server is now running on port: " + PORT);