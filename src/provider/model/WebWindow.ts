import {_Window} from 'openfin/_v2/api/window/window';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';

export interface WebWindow {
    document: Document;
    window: _Window;
}

/**
 * Create a WebWindow with access to v1 & v2 window methods & properties. This will be replaced when getWebWindow() gets added to the stable release channel.
 * @param options OpenFin window options.
 */
export async function createWebWindow(options: WindowOption): Promise<WebWindow> {
    const windowV1 = await createV1Window(options);
    const nativeWindow = windowV1.getNativeWindow();
    const document = nativeWindow.document;
    const windowV2 = fin.Window.wrapSync({name: windowV1.name, uuid: windowV1.uuid});
    return {document, window: windowV2};
}

/**
 *  Promise based v1 window creation
 * @param options Openfin window options.
*/
function createV1Window(options: WindowOption): Promise<fin.OpenFinWindow> {
    return new Promise((resolve, reject) => {
        const win = new fin.desktop.Window(options, () => {
            resolve(win);
        }, (error) => {
            reject(error);
        });
    });
}
