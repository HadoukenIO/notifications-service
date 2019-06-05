import {Application} from 'hadouken-js-adapter';

import {fin} from './fin';

// TODO: Make this a util modeled on layouts' spawn utils (SERVICE-524)
const nextUuid = (() => {
    let count = 0;
    return () => 'notifications-test-app-' + (count++);
})();

export async function createTestApp():Promise<Application> {
    const uuid = nextUuid();
    const app = await fin.Application.create({
        uuid,
        name: uuid,
        url: 'http://localhost:3922/test/test-app.html',
        autoShow: true,
        showTaskbarIcon: false,
        defaultHeight: 400,
        defaultWidth: 500
    });
    await app.run();
    return app;
}
