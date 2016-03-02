//Lets require/import the HTTP module
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var exec = require('child_process').exec;
var request = require('request')

//Lets define a port we want to listen to
var PORT=8081; 

app.use(bodyParser.json())
//We need a function which handles requests and send response
app.post('/', function (req, res) {
  res.send('Recieved');
  console.log('Recieved request');
  var refs = req.body.ref.split('/')
  if (refs[refs.length -1] === 'master') {
    console.log('Building');
    exec("./build.sh", {
      maxBuffer: 500*1024,
    }, function(error, stdout, stderr) {
      if (error) {
        return reportError(error);
      }

      console.log(stdout);
      console.log(stderr);
    });
  }
})

//Create a server
var server = app.listen(PORT, function() {
  console.log('listening on port:', PORT);
})


var reportError = function(err) {
  console.error('Build Error');
  console.error(err);
  request.post('https://hooks.slack.com/services/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',
    {
      text: "Build Failed!\n Error: " + err + '\nTrace: ' + err.stack,
    }, function(err) {
      if (err) {
      console.log('Error: ', err, err.stack);
      }
    }
  );
}
