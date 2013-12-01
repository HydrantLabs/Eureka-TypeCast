// Load deps
var os = require('os');
var express = require('express');
var fs = require('fs');
var https = require('https');

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

		// Get the path
		var path = req.url.split('?')[0];

		// On chromecast apps request, hijack
		if (path === '/cast/chromecast/device/config') {
			
			// Build actual data object
			var data = "";
			proxy_res.addListener('data', function(chunk) {
				data += chunk;
			});
			proxy_res.addListener('end', function() {

				// Get the actual data
				data = JSON.parse(data.substring(5));

				// Enable chrome remote debug
				data.configuration.content_shell_remote_debugging_port = 9222;

				// Start the response
				res.writeHead(proxy_res.statusCode, proxy_res.headers);

				// Send the stupid escape and the data
				res.end(')]}\'\n' + JSON.stringify(data));

			});

		} else {

			// Proxy the request normally
			proxy_res.addListener('data', function(chunk) {
				res.write(chunk, 'binary');
			});
			proxy_res.addListener('end', function() {
				res.end();
			});
			res.writeHead(proxy_res.statusCode, proxy_res.headers);

		}

	});

	req.on('data', function(chunk) {
		proxy_req.write(chunk, 'binary');
	});
	req.addListener('end', function() {
		proxy_req.end();
	});

}).listen(443);