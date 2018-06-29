const numApps = 3;

const baseUrl = window.location.href.split('/').slice(0, -1).join('/');

console.log(`spawning apps in: ${baseUrl}`)

fin.desktop.main(async () => {

    for (let i = 0; i < numApps; i++) {
        const conf = { 
            "name" : `OpenFin Notifications Demo App ${i}`
            , "uuid": `notifications-demoapp-${i}`
            , "url" : `${baseUrl}/app.html`
            , "mainWindowOptions": {
                "defaultHeight": 420,
                "defaultWidth": 250,
                "defaultTop": 100*i,
                "defaultLeft": 100*i,
                "saveWindowState" : false,
                "autoShow": true
            }
        };
        console.log(`spawning app ${i} with config`, conf);
        const app = new fin.desktop.Application(conf, () => {
            console.log(`app ${i} created, let's run it...`);
            app.run();
        }, console.error);
    }

});