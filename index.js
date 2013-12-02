// Load deps
var os = require('os');
var express = require('express');
var fs = require('fs');
var https = require('https');
var request = require('request');

// Create express app
var app = express();

// Setup server to server files from /public
app.configure(function(){
  app.use(express.static(__dirname + '/public'));
});

// Request for the serial number
app.get('/api/status/serial', function(req, res, next){
	res.end(fs.readFileSync('/factory/serial.txt').toString().trim());
});

// Request for the mac address
app.get('/api/status/mac', function(req, res, next){
	res.end(fs.readFileSync('/sys/class/net/mlan0/address').toString().trim());
});

// Request for the ip address
app.get('/api/status/mac', function(req, res, next){
	res.end(os.networkInterfaces()['mlan0'][0].address);
});

// Start listening
app.listen(80);

// Start a https server
https.createServer({
	key: fs.readFileSync('ssl/TypeCast.key'),
	cert: fs.readFileSync('ssl/TypeCast.crt')
}, function (req, res) {

	// Get the path
	var path = req.url.split('?')[0];

	console.log("Request", path);

	// On chromecast apps request, hijack
	if (path === '/cast/chromecast/device/config') {

		// Contact real google apps list
		request('https://clients3.google.com' + req.url, function (error, response, body) {
			
			// If success
			if (!error && response.statusCode == 200) {

				// Get the actual data, removing the stupid escape sequence
				var data = JSON.parse(body.substring(5));

				// Enable chrome remote debug
				data.configuration.content_shell_remote_debugging_port = 9222;

				// Add a boot animation app
				data.applications.push({
					"use_channel": false,
					"allow_restart": true,
					"allow_empty_post_data": true,
					"external": true,
					"app_name": "Boot",
					"command_line": "/system/bin/boot_animation"
				});

				// Start the response
				res.writeHead(response.statusCode, response.headers);

				// Send the stupid escape and the data
				res.end(')]}\'\n' + JSON.stringify(data));

			} else {

				res.writeHead(500, response.headers);
				res.end('Error');

			}

		});

	} else {

		// Copy the headers
		var headers = req.headers;

		// Set the Host correctly
		headers.Host = 'clients3.google.com';

		// Proxy request to actual site
		var proxy_req = https.request({
			hostname: headers.Host,
			port: 443,
			path: req.url,
			method: req.method,
			headers: headers
		}, function(proxy_res) {

			// Proxy the request normally
			proxy_res.addListener('data', function(chunk) {
				res.write(chunk, 'binary');
			});
			proxy_res.addListener('end', function() {
				res.end();
			});
			res.writeHead(proxy_res.statusCode, proxy_res.headers);

		});

		req.on('data', function(chunk) {
			proxy_req.write(chunk, 'binary');
		});
		req.addListener('end', function() {
			proxy_req.end();
		});

	}

}).listen(443);

console.log("Started!");
