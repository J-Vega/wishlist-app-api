'use strict';

exports.DATABASE_URL = 
	process.env.DATABASE_URL || 'mongodb://testuser:abc123@ds135003.mlab.com:35003/fullstack-capstone'; 

exports.TEST_DATABASE_URL = 
	process.env.TEST_DATABASE_URL || 'mongodb://testuser:abc123@ds135003.mlab.com:35003/fullstack-capstone';

exports.CLIENT_ORIGIN =
	process.env.CLIENT_ORIGIN || '*';

exports.JWT_SECRET = 'a'; //Key used to create encrypted pw

exports.JWT_EXPIRY = '7d';
//Reference - Google pw salt - gives random 64 bit character string

exports.PORT = process.env.PORT || 3000;