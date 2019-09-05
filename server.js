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

router.get('/step3', function(req, res) {
	res.json({ message: 'step 3 test' });
	stepThree('cf44c070-b1b5-0137-8fb4-0a93ad5e9076');
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
var FILE_LOCATION = '/Users/jeffrey.tansey/repos/playground/ionic/ionic3/jeff_org1_app1_003.apk';

// Step One of AppCenter Release process
var stepOne = function() {
	console.log('stepOne');

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
			
			var myObject = JSON.parse(body);
			console.log(myObject);
			console.log('myObject.upload_url: ' + myObject.upload_url);

			stepTwo(myObject.upload_id, myObject.upload_url);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});
}

// Step Two of AppCenter Release process
var stepTwo = function (uploadId, uploadUrl) {
	console.log('stepTwo');

	var headers = {
		'Content-Type': 'multipart/form-data',
	}

	console.log('uploadUrl: ' + uploadUrl);
	
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
		if (!err && httpResponse.statusCode == 204) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
			stepThree(uploadId);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

// Step Three of AppCenter Release process
var stepThree = function (uploadId) {
	console.log('stepThree');
	console.log('uploadId: ' + uploadId);

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
		json: true,
		body: {
			"status": "committed"
		}
	}

	request.patch(options, function (err, httpResponse, bodyResponse) {
		console.log('after request.patch');

		if (!err && httpResponse.statusCode == 200) {
			console.log('statusCode: ' + httpResponse.statusCode);

			console.log('bodyResponse: ' + bodyResponse);
			console.log('bodyResponse.release_id: ' + bodyResponse.release_id);
			// var myObject2 = JSON.stringify(bodyResponse);
			// var myObject2 = JSON.parse(bodyResponse);
			// console.log('myObject: ' + myObject2);
			// console.log('myObject.release_id: ' + myObject2.release_id);

			stepFour(bodyResponse.release_id);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

// Step Four of AppCenter Release process
var stepFour = function (releaseId) {
	console.log('stepFour');

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': X_API_TOKEN
	} 
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+ORG_NAME+"/"+APP_NAME+"/releases/"+releaseId,
		headers: headers,
		rejectUnauthorized: false,
		json: true,
		body: {
			"destination_name": "Collaborators", 
		}
		//TODO check to see if Collaborators is default group? Need to check the example with 100's of apps from transitioning 
		//	from HockeyApp to AppCenter
	}

	request.patch(options, function (err, httpResponse, body) {
		console.log('after request.patch');

		if (!err && httpResponse.statusCode == 200) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}
