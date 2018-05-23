const openfinLauncher = require('openfin-launcher');
const express = require('express');
const app = express();
const path = require('path');
const https = require('https');
const fs = require('fs');
const http = require('http');

var env = process.env.NODE_ENV || 'prod';
var ext = ".json";

if(env === 'dev'){
    ext = '-dev' + ext;
    console.log("running from local app configs")
} else {
    console.log("running from CDN app configs")
}

const NS = path.resolve('./dist/demo/appService' + ext);
const NClient = path.resolve('./dist/demo/appClient' + ext);
const NClient2 = path.resolve('./dist/demo/appClient2' + ext);

const httpsConfig = {
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'certificate.pem')),
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    passphrase: 'salesdemo'
};

//Update our config and launch openfin.
function launchOpenFin(config) {
    openfinLauncher
        .launchOpenFin({ configPath: config })
        .catch(err => console.log(err));
}

app.use(express.static('./dist'));

https.createServer(httpsConfig, app).listen(9048, () => {
    console.log("Server Created!");
    if (env === 'dev') {
        console.log("Starting NS");
        launchOpenFin(NS);
    }
    console.log("Starting NClient");
    launchOpenFin(NClient);
    console.log("Starting NClient2");
    launchOpenFin(NClient2);
});

