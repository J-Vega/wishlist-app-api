'use strict';

const mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Not yet
const bcrypt = require('bcryptjs');

const productListingSchema = mongoose.Schema({
    name: {type: String, required: true},
    price: {type: String , required: true},
    link: {type: String , required: true},
    imageUrl: {type: String , required: true},
    comment: String,//i.e. "Buy this for Suzy on Christmas"
    created: {type: Date, required:true, default: Date.now}
});

const userWishListSchema = mongoose.Schema({
    
    //The username of the person creating the list, should be set
    // automatically
    user: {type: String, required: true},
    //The name of the list, chosen by the user
    category: {type: String, required: true},
    items: [productListingSchema],
    created: {type: Date, required:true, default: Date.now}

},{collection:"UserWishLists"});

const userProfileSchema = mongoose.Schema({
  
    userName: {type: String, required: true, unique: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    // wishLists: [userWishListSchema],
    created: {type: Date, default: Date.now}
    
},{collection:"UserProfiles"});

userProfileSchema.methods.serialize = function(){
  return {
    id: this._id,
    userName: this.userName,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    created: this.created
  };
};

userWishListSchema.methods.serialize = function(){
  return{
    id: this._id,
    user: this.user,
    category: this.category,
    created: this.created
  };
};

productListingSchema.methods.serialize = function(){
  return{
    name: this.name,
    price: this.price,
    link: this.link,
    imageUrl: this.imageUrl,
    comment: this.comment
  };
};

userProfileSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userProfileSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const UserProfiles = mongoose.model('UserProfiles', userProfileSchema);
const UserWishLists = mongoose.model('UserWishLists', userWishListSchema);
const ProductListing = mongoose.model('ProductListing', productListingSchema);

module.exports = {UserProfiles, UserWishLists, ProductListing};



//End