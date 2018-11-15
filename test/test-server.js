const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { app, closeServer, runServer } = require('../server');
const faker = require('faker');
const should = chai.should();
const expect = chai.expect;

const { UserWishLists, UserProfiles } = require('../models.js');

const { TEST_DATABASE_URL } = require('../config.js');

chai.use(chaiHttp);

function generateUserData() {
  var userName = "user" + faker.random.word();
  var firstName = faker.name.firstName();
  var lastName = faker.name.lastName();
  var password = "abcd123456";
  var email = faker.random.word() + "@" + faker.random.word() + ".com";

  return {
    userName: userName,
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    created: faker.date.past()
  }
}

function seedUserData() {
  const testData = [];

  for (let i = 1; i <= 5; i++) {
    testData.push(generateUserData());
  }
  return UserProfiles.insertMany(testData);
}

function seedWishListData() {
  const testData = [];

  for (let i = 1; i <= 5; i++) {
    testData.push(generateWishListData());
  }
  return UserWishLists.insertMany(testData);
}

function generateWishListData() {

  return {
    "user": "jvega",
    "wishlists": {
      "category": "Easter",
      "items": {
        "name": "costume",
        "price": "299.99",
        "link": "costume.com",
        "imageUrl": "url.com"
      }
    }
  }
}

function tearDownDb() {
  return mongoose.connection.db.dropDatabase();
}


describe('Wishlist API', function () {
  before(function () {
    return runServer(TEST_DATABASE_URL, 8081);
  });

  beforeEach(function () {
    return seedWishListData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });
  it('should 200 on GET requests', function () {
    return chai.request(app)
      .get('/api/fooooo')
      .then(function (res) {
        res.should.have.status(200);
        res.should.be.json;
      });
  });

  it("should add an item on POST", function () {
    const newItem = {
      "user": "jvega",
      "category": "Easter",
      "item": {
        "name": "costuume",
        "price": "299.99",
        "link": "coostume.com",
        "imageUrl": "ourl.com"
      }
    };

    return chai
      .request(app)
      .post("/Wishlist")
      .send(newItem)
      .then(function (res) {
        console.log(res.body);
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a("object");
        expect(res.body).to.include.keys(
          '_id', 'user', 'wishlists');
        expect(res.body.id).to.not.equal(null);

      });
  });



  describe('DELETE endpoint', function () {

    it('delete a wishlist by id', function () {

      let wishlist;

      return UserWishLists
        .findOne()
        .then(function (_wishlist) {
          wishlist = _wishlist;
          return chai.request(app).delete(`/Wishlist/${wishlist.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return UserWishLists.findById(wishlist.id);
        })
        .then(function (_wishlist) {
          expect(_wishlist).to.be.null;
        });
    });
  });

});

describe('User data API resource', function () {

  before(function () {
    return runServer(TEST_DATABASE_URL, 8081);
  });

  beforeEach(function () {
    return seedUserData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });

  describe('GET endpoint', function () {
    it('should return all existing users', function () {

      let res;
      return chai.request(app)
        .get("/users")
        .then(function (_res) {
          res = _res;

          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);

          return UserProfiles.count();
        })
        .then(function (count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });

  describe('POST endpoint', function () {

    it('should add a new user', function () {

      const newUser = generateUserData();

      return chai.request(app)
        .post('/users')
        .send(newUser)
        .then(function (res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'userName', 'firstName', 'lastName');

          expect(res.body.id).to.not.be.null;
          expect(res.body.userName).to.equal(newUser.userName);
          expect(res.body.firstName).to.equal(newUser.firstName);
          expect(res.body.lastName).to.equal(newUser.lastName);
          expect(res.body.password).to.not.equal(null);

          return UserProfiles.findById(res.body.id);
        })
        .then(function (listing) {

          expect(listing.userName).to.equal(newUser.userName);
          expect(listing.firstName).to.equal(newUser.firstName);
          expect(listing.lastName).to.equal(newUser.lastName);
          expect(listing.password).to.not.equal(null);

        });
    });
  });

  describe('DELETE endpoint', function () {

    it('delete a user by id', function () {

      let user;

      return UserProfiles
        .findOne()
        .then(function (_user) {
          user = _user;
          return chai.request(app).delete(`/users/${user.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          return UserProfiles.findById(user.id);
        })
        .then(function (_user) {
          expect(_user).to.be.null;
        });
    });
  });

});