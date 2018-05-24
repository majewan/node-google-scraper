const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser')
const app = express();

app.use( bodyParser.json() );

app.get('/', (req, res) => res.sendFile(__dirname + '/mock-home.html'));
app.get('/search', (req, res) => res.sendFile(__dirname + '/mock-result.html'));

app.post('/test', (req, res) => {
  app.emit('test', req);
  res.send('OK');
});

exports.app = app;

const credentials = {
  cert: fs.readFileSync(__dirname + '/self-signed.crt', 'utf8'),
  key: fs.readFileSync(__dirname + '/self-signed.key', 'utf8')
};

exports.server = https.createServer(credentials, app);
