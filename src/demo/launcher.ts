const numApps: number = 3;

const baseUrl: string = window.location.href.split('/').slice(0, -1).join('/');

console.log(`creating ${numApps} apps at: ${baseUrl}`);

fin.desktop.main(async () => {
    const promises = [];

    for (let i = 0; i < numApps; i++) {
        const conf = {
            name: `OpenFin Notifications Demo App ${i}`,
            uuid: `notifications-demoapp-${i}`,
            url: `${baseUrl}/app.html`,
            mainWindowOptions: {
                defaultHeight: 535,
                defaultWidth: 305,
                saveWindowState: true,
                autoShow: true
            }
        };

        console.log(`spawning app ${i} with config`, conf);
        const app = await fin.Application.start(conf);

        promises.push(new Promise(resolve => {
            app.once('closed', resolve);
        }));
    }

    // If all of the apps launched above close, then close this app too
    Promise.all(promises).then(() => fin.Application.getCurrentSync().close());
});
