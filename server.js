const openfinLauncher = require('openfin-launcher');
const express = require('express');
const os = require('os')
const app = express();
const path = require('path');
const http = require('http');

const appsConf  = path.resolve('./dist/demo/apps.json');                     

const port = process.env.port || 9048

app.use(express.static('./dist'));

http.createServer(app).listen(port, () => {
    console.log(`Server running on port: ${port}`);

    // launch the main demo apps launcher
    openfinLauncher.launchOpenFin({ configPath: appsConf }).catch(err => console.log(err));

    // on OS X we need to launch the provider manually (no RVM)
    if (os.platform() === 'darwin') {
        console.log("Starting Provider for Mac OS");
        const providerConf = path.resolve('./dist/app.json');
        openfinLauncher.launchOpenFin({ configPath: providerConf }).catch(err => console.log(err));
    }
});
