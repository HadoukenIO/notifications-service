import {Application} from 'openfin/_v2/main';

const numApps: number = 3;
const baseUrl: string = window.location.href.split('/').slice(0, -1).join('/');

console.log(`creating ${numApps} apps at: ${baseUrl}`);

(async () => {
    const uuids: string[] = [];
    for (let i=0; i<numApps; i++) {
        uuids.push(`notifications-demoapp-${i}`);
    }

    // Start the desired number of test apps
    await Promise.all(uuids.map(async (uuid: string, index: number) => {
        const conf = {
            uuid,
            name: `OpenFin Notifications Demo App ${index}`,
            url: `${baseUrl}/app.html`,
            mainWindowOptions: {
                defaultHeight: 565,
                defaultWidth: 350,
                saveWindowState: true,
                autoShow: true
            }
        };

        console.log(`spawning app ${index} with config`, conf);
        await fin.Application.start(conf);
    }));

    // Close this launcher app once all launched programs have exited
    fin.System.addListener('application-closed', async () => {
        const apps: Application[] = uuids.map(uuid => fin.Application.wrapSync({uuid}));
        const appsRunning: boolean[] = await Promise.all(apps.map(app => app.isRunning()));
        const numAppsRunning: number = appsRunning.reduce((count, isRunning) => count + (isRunning ? 1 : 0), 0);

        console.log(`App closed, ${numAppsRunning} test apps running`);

        if (numAppsRunning === 0) {
            // All applications have been closed, also close this launcher so that the service can shut down
            console.log('Exiting launcher');
            await fin.Application.getCurrentSync().close();
        }
    });
})();
