/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/demo/app.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/client/index.ts":
/*!*****************************!*\
  !*** ./src/client/index.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
console.log('Client index.js loaded');
const config_1 = __webpack_require__(/*! ../shared/config */ "./src/shared/config.ts");
const version_1 = __webpack_require__(/*! ./version */ "./src/client/version.ts");
const IDENTITY = {
    uuid: 'notifications-service',
    name: 'Notifications-Service',
    channelName: 'notifications-service'
};
// For testing/display purposes
const notificationClicked = (payload, sender) => {
    console.log('notificationClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};
// For testing/display purposes
const notificationButtonClicked = (payload, sender) => {
    console.log('notificationButtonClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};
// For testing/display purposes
const notificationClosed = (payload, sender) => {
    console.log('notificationClosed hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClosed success';
};
const callbacks = {
    notificationClicked,
    notificationButtonClicked,
    notificationClosed
};
async function createClientPromise() {
    await new Promise((resolve, reject) => {
        if (!fin) {
            reject('fin is not defined, This module is only intended for use in an OpenFin application.');
        }
        fin.desktop.main(() => resolve());
    });
    try {
        const opts = { payload: { version: version_1.version } };
        const clientP = fin.InterApplicationBus.Channel.connect(config_1.CHANNEL_NAME, opts).then((client) => {
            // tslint:disable-next-line:no-any
            client.register('WARN', (payload) => console.warn(payload));
            client.register('notification-clicked', (payload, sender) => {
                callbacks.notificationClicked(payload, sender);
            });
            client.register('notification-button-clicked', (payload, sender) => {
                callbacks.notificationButtonClicked(payload, sender);
            });
            client.register('notification-closed', (payload, sender) => {
                callbacks.notificationClosed(payload, sender);
            });
            return client;
        });
        return clientP;
    }
    catch (e) {
        console.error(e);
        return null;
    }
}
const clientP = createClientPromise();
/**
 * @method create Creates a new notification
 * @param {string} id The id of the notification
 * @param {NotificationOptions} options notification options
 */
async function create(id, options) {
    const plugin = await clientP;
    const payload = Object.assign({}, { id }, options);
    const notification = await plugin.dispatch('create-notification', payload);
    return notification;
}
exports.create = create;
/**
 * @method getAll get all notifications for this app
 */
async function getAll() {
    const plugin = await clientP;
    const appNotifications = await plugin.dispatch('fetch-app-notifications', {});
    return appNotifications;
}
exports.getAll = getAll;
/**
 * @method clear clears a notification by it's ID
 * @param {string} id The id of the notification
 */
async function clear(id) {
    const plugin = await clientP;
    const payload = { id };
    const result = await plugin.dispatch('clear-notification', payload);
    return result;
}
exports.clear = clear;
/**
 * @method clearAll clears all notifications for an app
 */
async function clearAll() {
    const plugin = await clientP;
    const result = await plugin.dispatch('clear-app-notifications');
    return result;
}
exports.clearAll = clearAll;
/**
 * @method clearAll clears all notifications for an app
 * @param {string} evt the event name
 * @param {(payload: NotificationEvent, sender: ISenderInfo) => string)} cb event handler callback
 */
async function addEventListener(evt, cb) {
    if (evt === 'click') {
        callbacks.notificationClicked = cb;
    }
    else if (evt === 'close') {
        callbacks.notificationClosed = cb;
    }
    else if (evt === 'button-click') {
        callbacks.notificationButtonClicked = cb;
    }
}
exports.addEventListener = addEventListener;


/***/ }),

/***/ "./src/client/version.ts":
/*!*******************************!*\
  !*** ./src/client/version.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// generated by genversion
exports.version = '0.9.6';


/***/ }),

/***/ "./src/demo/app.ts":
/*!*************************!*\
  !*** ./src/demo/app.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const ofnotes = __webpack_require__(/*! ../client/index */ "./src/client/index.ts");
function makeNote(id, opts) {
    return ofnotes.create(id, Object.assign(opts, { date: Date.now() }));
}
function clearNote(id) {
    return ofnotes.clear(id);
}
function getNotes() {
    return ofnotes.getAll();
}
const normalNote = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    context: { testContext: 'testContext' },
    date: new Date(),
    buttons: [],
    inputs: []
};
const buttonNote = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    context: { testContext: 'testContext' },
    date: new Date(),
    buttons: [{ title: 'test1', icon: 'favicon.ico' }, { title: 'test2', icon: 'favicon.ico' }],
    inputs: []
};
function makeNoteOfType(index) {
    if (index % 2 === 1) {
        return makeNote(`1q2w3e4r${index}`, normalNote);
    }
    else {
        return makeNote(`1q2w3e4r${index}`, buttonNote);
    }
}
// document.addEventListener("DOMContentLoaded", function (event) {
//     for (let index = 1; index < 7; index++) {
//         document.getElementById(`button${index}`).addEventListener('click',
//         () => {
//             makeNoteOfType(index)
//                 .then((notification) => {
//                     if (!notification.success) {
//                         //
//                         document.getElementById('clientResponse').innerHTML =
//                         `
//                         //             Notification ids must be unique! This
//                         id already exists!
//                         //         `
//                         logit(`Notification ids must be unique! This id
//                         already exists!`);
//                     }
//                 })
//         });
//         document.getElementById(`clearbutton${index}`).addEventListener('click',
//         () => {
//             clearNote(`1q2w3e4r${index}`)
//         });
//     }
//     document.getElementById(`fetchAppNotifications`).addEventListener('click',
//     () => {
//         getNotes()
//             .then((notifications) => {
//                 // document.getElementById('clientResponse').innerHTML = `
//                 //     ${notifications.value.length} notifications received
//                 from the Notification Center!
//                 // `
//                 logit(`${notifications.value.length} notifications received
//                 from the Notification Center`);
//             })
//     });
// });
fin.desktop.main(async () => {
    const clientResponse = document.getElementById('clientResponse');
    function logit(msg) {
        const logEntry = document.createElement('div');
        logEntry.innerHTML = msg;
        clientResponse.insertBefore(logEntry, clientResponse.firstChild);
    }
    for (let index = 1; index < 7; index++) {
        document.getElementById(`button${index}`).addEventListener('click', () => {
            makeNoteOfType(index).then((notification) => {
                if (!notification.success) {
                    // document.getElementById('clientResponse').innerHTML = `
                    //             Notification ids must be unique! This id already
                    //             exists!
                    //         `
                    logit(`Notification ids must be unique! This id already exists!`);
                }
            });
        });
        document.getElementById(`clearbutton${index}`).addEventListener('click', () => {
            clearNote(`1q2w3e4r${index}`);
        });
    }
    document.getElementById(`fetchAppNotifications`).addEventListener('click', () => {
        getNotes().then((notifications) => {
            // document.getElementById('clientResponse').innerHTML = `
            //     ${notifications.value.length} notifications received from the
            //     Notification Center!
            // `
            logit(`${notifications.value.length} notifications received from the Notification Center`);
        });
    });
    ofnotes.addEventListener('click', (payload, sender) => {
        // document.getElementById('clientResponse').innerHTML = `CLICK action
        // received from notification ${payload.id}`
        logit(`CLICK action received from notification ${payload.id}`);
        return '';
    });
    ofnotes.addEventListener('close', (payload, sender) => {
        // document.getElementById('clientResponse').innerHTML = `CLOSE action
        // received from notification ${payload.id}`
        logit(`CLOSE action received from notification ${payload.id}`);
        return '';
    });
    ofnotes.addEventListener('button-click', (payload, sender) => {
        const buttonClicked = payload.buttons[payload.buttonIndex];
        console.log(buttonClicked);
        const buttonTitle = buttonClicked.title;
        // document.getElementById('clientResponse').innerHTML = `Button Click
        // on ${buttonTitle} action received from notification ${payload.id}`
        logit(`BUTTON CLICK on ${buttonTitle} from notification ${payload.id}`);
        return '';
    });
});


/***/ }),

/***/ "./src/shared/config.ts":
/*!******************************!*\
  !*** ./src/shared/config.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNEL_NAME = 'of-notifications-service-v1';


/***/ })

/******/ });
//# sourceMappingURL=app.js.map