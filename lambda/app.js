/*
Paste this into the app.js that Amplify opens for you when creating a new REST endpoint.
*/

var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const AWS = require('aws-sdk');



// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

app.post('/classify', async function(req, res) {
  const sagemaker = new AWS.SageMakerRuntime({
    apiVersion: '2017-05-13',
    region:req.body.endpointRegion,
  });
  const result = await sagemaker.invokeEndpoint({
    Body: Buffer.from(req.body.base64Image, 'base64'),
    EndpointName: req.body.endpointName,
    ContentType: 'application/x-image',
    Accept: 'application/json',
  }).promise();
  
  res.json({predictions: JSON.parse(result.Body.toString())})
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
