var express = require('express'); 
var https = require('https'); 
var http = require('http'); 
var fs = require('fs'); 
var url = require('url'); 
var MongoClient = require('mongodb').MongoClient;
var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function(user, pass) {
  return((user ==='cs360')&&(pass === 'test'));
});
var app = express(); 
var bodyParser = require('body-parser');
var options = { 
  host: '127.0.0.1', 
  key: fs.readFileSync('ssl/server.key'), 
  cert: fs.readFileSync('ssl/server.crt') 
}; 
http.createServer(app).listen(80); 
https.createServer(options, app).listen(443); 
app.use('/', express.static('./html', {maxAge: 60*60*1000}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.get('/', function (req, res) { 
  res.send("Get Index");
});
app.get('/getcity', function (req, res) {
  var urlObj = url.parse(req.url, true, false);
  console.log("In getcity route");
  fs.readFile("html/cities.dat.txt", function (err,data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      console.log("about to set data to cities");
      var cities = data.toString().split("\n");
      var json = [];
      var myRe = new RegExp("^" +  urlObj.query["q"]);
      for (var i = 0; i < cities.length; i++) {
        var result = cities[i].search(myRe);
        if (result != -1) {
          json.push({city:cities[i]});
        }
      }
      console.log(JSON.stringify(json));
      res.writeHead(200, { 'Content-Type': 'jsonp' });
      res.end(JSON.stringify(json));
      return;
    });
});
app.get('/comment', function(req, res) {
  console.log("In Comment route");
  MongoClient.connect("mongodb://localhost/weather", function(err, db) {
        if (err) throw err;
        db.collection('comments', function(err, comments) {
          if (err) throw err;
          comments.find(function(err, items) {
            items.toArray(function(err, itemArr) {
              console.log("Document Array: ");
              console.log(itemArr);
              res.json(itemArr);
            });
          });
        });
      });
});
app.post('/comment', auth, function(req, res) {
  console.log("In Post comment route");
  console.log(req.body.Name);
  console.log(req.body.Comment);
  if ((req.body.Name.indexOf('<') === -1) && (req.body.Comment.indexOf('<') === -1)) {
    MongoClient.connect("mongodb://localhost/weather", function(err, db) {
      if (err) throw err;
      db.collection('comments').insert(req.body,function(err,records) {     
	console.log("Record added as " + records[0]._id);
        res.writeHead(200);
        res.end("");
      });
    });
  }
});
