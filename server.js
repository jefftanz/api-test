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

var params = {
	'xApiToken': '1243fea9ebe3527f5ee7609c0ebee920953b10cb',
	'orgName': 'Jeff_Org1',
	'appName': 'app3',
	'displayName': 'app3',
	'os': 'Android',
	'src': '/Users/jeffrey.tansey/repos/playground/ionic/ionic3/jeff_org1_app1_004.apk'
}

router.get('/upload', function(req, res) {
	res.json({ message: 'upload route' });
	upload(params);
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
// var X_API_TOKEN = '1243fea9ebe3527f5ee7609c0ebee920953b10cb';
// TODO pass Organization Name and App Name parameters into function? Or Hardcoded globals?
// var APP_NAME = 'app1';
// var RELEASE_ID = '3'; // Manually increment for testing?
// var FILE_LOCATION = '/Users/jeffrey.tansey/repos/playground/ionic/ionic3/jeff_org1_app1_003.apk';

// var upload = function (params) {
// 	if (appExists(params.appName)){
// 		stepOne(params);
// 	} else {
// 		createNewApp(params);
// 	}
// }

var upload = function (params) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': params.xApiToken
	}
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/orgs/"+params.orgName+"/apps",
		headers: headers,
		rejectUnauthorized: false,
	}

	request.get(options, function (err, httpResponse, body) {
		var appExists = false;
		var myObject = JSON.parse(body);
		if (!err && httpResponse.statusCode == 200) {
			console.log('statusCode: ' + httpResponse.statusCode);
			for (var i = 0; i < body.length; i++){
				if (myObject[i].name == params.appName){
					appExists = true;
					break;
				}
			}

			if (appExists){
				stepOne(params);
			} else {
				// Write to logs and say that we could not find this application, going to create it. 
				createNewApp(params);
			}

		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

var createNewApp = function (params) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': params.xApiToken
	}
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/orgs/"+params.orgName+"/apps",
		headers: headers,
		rejectUnauthorized: false,
		json: true,
		body:	{
			"description": "description",
			"release_type": "Beta",
			"display_name": params.displayName,
			"name": params.appName,
			"os": params.os,
			"platform": "Cordova"
		}
	}

	request.post(options, function (err, httpResponse, body) {

		if (!err && (httpResponse.statusCode == 201 || httpResponse.statusCode == 200)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			stepOne(params);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

// Step One of AppCenter Release process
var stepOne = function(params) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': params.xApiToken
	}
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+params.orgName+"/"+params.appName+"/release_uploads",
		headers: headers,
		rejectUnauthorized: false
	}

	request.post(options, function (err, httpResponse, body) {
		if (!err && (httpResponse.statusCode == 200 || httpResponse.statusCode == 201)) {
			console.log('statusCode: ' + httpResponse.statusCode);
			var myObject = JSON.parse(body);
			stepTwo(params, myObject.upload_id, myObject.upload_url);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});
}

// Step Two of AppCenter Release process
var stepTwo = function (params, uploadId, uploadUrl) {

	var headers = {
		'Content-Type': 'multipart/form-data',
	}

	var options = {
		url: uploadUrl,
		headers: headers,
		rejectUnauthorized: false,
		formData: {
			ipa: fs.createReadStream(params.src)
		}
	}

	request.post(options, function (err, httpResponse, body) {
		if (!err && httpResponse.statusCode == 204) {
			console.log('statusCode: ' + httpResponse.statusCode);
			console.log('body: ' + body);
			stepThree(params, uploadId);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

// Step Three of AppCenter Release process
var stepThree = function (params, uploadId) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': params.xApiToken
	}
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+params.orgName+"/"+params.appName+"/release_uploads/"+uploadId,
		headers: headers,
		rejectUnauthorized: false,
		json: true,
		body: {
			"status": "committed"
		}
	}

	request.patch(options, function (err, httpResponse, bodyResponse) {
		if (!err && httpResponse.statusCode == 200) {
			console.log('statusCode: ' + httpResponse.statusCode);
			stepFour(params, bodyResponse.release_id);
		} else {
			console.log('error: ' + err);
			console.log('statusCode: ' + httpResponse.statusCode);
			// Send an error Message via Email
		}
	});

}

// Step Four of AppCenter Release process
var stepFour = function (params, releaseId) {

	var headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'X-API-Token': params.xApiToken
	} 
	
	var options = {
		url: "https://api.appcenter.ms/v0.1/apps/"+params.orgName+"/"+params.appName+"/releases/"+releaseId,
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
