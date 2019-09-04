// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var request = require('request');
var fs = require('fs');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port     = process.env.PORT || 8080; // set our port

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });	
});

router.get('/test', function(req, res) {
	res.json({ message: 'test route' });
	stepOne(RELEASE_ID);
});

// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

// Global Variables
var X_API_TOKEN = '1243fea9ebe3527f5ee7609c0ebee920953b10cb';
// TODO pass Organization Name and App Name parameters into function? Or Hardcoded globals?
var ORG_NAME = 'Jeff_Org1';
var APP_NAME = 'app1';
var RELEASE_ID = '3'; // Manually increment for testing?
var FILE_LOCATION = '';

// Step One of AppCenter Release process
var stepOne = function(releaseId) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': X_API_TOKEN
	}
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+ORG_NAME+"/"+APP_NAME+"/release_uploads",
		headers: headers,
		rejectUnauthorized: false
	}

	request.post(options, function (err, httpResponse, body) {
		if (!err && (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
			stepTwo(body.upload_id, body.upload_url, releaseId);
		} else {
			console.log('error: ' + err);
			// Send an error Message via Email
		}
	});
}

// Step Two of AppCenter Release process
var stepTwo = function (uploadId, uploadUrl, releaseId) {

	var headers = {
		'Content-Type': 'multipart/form-data',
	}
	
	// TODO need File Source Location parameter
	var options = {
		url: uploadUrl,
		headers: headers,
		rejectUnauthorized: false,
		formData: {
			ipa: fs.createReadStream(FILE_LOCATION)
		}
	}

	request.post(options, function (err, httpResponse, body) {
		if (!err && (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
			stepThree(uploadId, releaseId);
		} else {
			console.log('error: ' + err);
			// Send an error Message via Email
		}
	});

}

// Step Three of AppCenter Release process
var stepThree = function (uploadId, releaseId) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': X_API_TOKEN
	}
	
	// TODO need File Source Location parameter
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+ORG_NAME+"/"+APP_NAME+"/release_uploads/"+uploadId,
		headers: headers,
		rejectUnauthorized: false,
		formData: {
			status: 'comitted'
		}
	}

	request.patch(options, function (err, httpResponse, body) {
		if (!err && (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
			stepFour(releaseId);
		} else {
			console.log('error: ' + err);
			// Fail the upload process
			// Send an error Message via Email
		}
	});

}

// Step Four of AppCenter Release process
var stepFour = function (releaseId) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': X_API_TOKEN
	} 
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+ORG_NAME+"/"+APP_NAME+"/releases/"+releaseId,
		headers: headers,
		rejectUnauthorized: false,
		formData: {
			destination_name: 'Collaborators'
		}
		//TODO check to see if Collaborators is default group? Need to check the example with 100's of apps from transitioning 
		//	from HockeyApp to AppCenter
	}

	request.patch(options, function (err, httpResponse, body) {
		if (!err && (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
		} else {
			console.log('error: ' + err);
			// Fail the upload process
			// Send an error Message via Email
		}
	});

}
