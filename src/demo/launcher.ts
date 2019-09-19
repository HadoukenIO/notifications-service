const numApps: number = 3;

const baseUrl: string = window.location.href.split('/').slice(0, -1).join('/');

console.log(`creating ${numApps} apps at: ${baseUrl}`);

fin.desktop.main(async () => {
    for (let i = 0; i < numApps; i++) {
        const conf = {
            'name': `Demo App ${i}`,
            'uuid': `notifications-demoapp-${i}`,
            'url': `${baseUrl}/app.html`,
            'mainWindowOptions': {
                'defaultHeight': 510,
                'defaultWidth': 350,
                'saveWindowState': true,
                'autoShow': true
            }
        };
        console.log(`spawning app ${i} with config`, conf);
        const app = new fin.desktop.Application(conf, () => {
            console.log(`app ${i} created, let's run it...`);
            app.run();
        }, console.error);
    }
});
