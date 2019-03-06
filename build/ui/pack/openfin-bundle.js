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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/provider/ui/openfin.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/provider/ui/TrayMenu.ts":
/*!*************************************!*\
  !*** ./src/provider/ui/TrayMenu.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const WindowInfo_1 = __webpack_require__(/*! ./WindowInfo */ "./src/provider/ui/WindowInfo.ts");
class TrayMenu {
    constructor(icon, parent) {
        this.icon = icon;
        this.parent = parent;
        this.window = this.createWindow();
        this.createTrayIcon();
    }
    /**
     * @method createWindow Creates the TrayMenu window
     * @returns fin.desktop.Window
     */
    createWindow() {
        return new fin.desktop.Window({
            name: 'TrayIconOptions',
            url: 'tray.html',
            defaultWidth: 300,
            defaultHeight: 35,
            defaultTop: 0,
            defaultLeft: 0,
            frame: false,
            saveWindowState: false,
            autoShow: false,
            alwaysOnTop: true,
            state: 'normal',
            showTaskbarIcon: false
        }, () => { }, (error) => {
            console.error('Failed to create TrayMenu Window', error);
        });
    }
    /**
     * @method clickHandler Handles click events from the tray menu icon
     * @returns void
     * @param clickInfo
     */
    clickHandler(clickInfo) {
        if (clickInfo.button === 0) {
            // left click
            if (WindowInfo_1.WindowInfo.instance.getShowingStatus()) {
                // Commented out until we resolve the runtime tray icon toast delay bug
                this.parent.hideWindow();
            }
            else {
                // closes any open OpenFin notifications on window show
                // notificationManager.closeAll();
                this.parent.showWindow();
            }
        }
        else if (clickInfo.button === 2) {
            // BSS - this destroys the service and is very ugly
            // // right click
            // this.window.moveTo(clickInfo.x, clickInfo.y - 35);
            // this.window.show();
            // this.window.setAsForeground();
            // this.window.focus();
        }
    }
    /**
     * @method createTrayIcon Creates the Tray Icon itself
     * @returns void
     */
    createTrayIcon() {
        fin.desktop.Application.getCurrent().setTrayIcon(this.icon, this.clickHandler.bind(this));
    }
}
exports.TrayMenu = TrayMenu;


/***/ }),

/***/ "./src/provider/ui/WindowInfo.ts":
/*!***************************************!*\
  !*** ./src/provider/ui/WindowInfo.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class WindowInfo {
    constructor() {
        this.height = 0;
        this.width = 0;
        this.idealHeight = 0;
        this.idealWidth = 388;
        this.isShowing = false;
        if (WindowInfo.singleton) {
            return WindowInfo.singleton;
        }
        this.recalibrate();
        fin.desktop.System.addEventListener('monitor-info-changed', this.recalibrate.bind(this));
        this.window.addEventListener('bounds-changed', this.recalibrate.bind(this));
        this.window.addEventListener('minimized', () => {
            this.setShowing(false);
        });
        this.window.addEventListener('hidden', () => {
            this.setShowing(false);
        });
        this.window.addEventListener('shown', () => {
            this.setShowing(true);
        });
        this.window.addEventListener('restored', () => {
            this.setShowing(true);
        });
        WindowInfo.singleton = this;
    }
    /**
     * @method getHeight Gets Attached Windows Height
     * @returns number
     */
    getHeight() {
        return this.height;
    }
    /**
     * @method getWidth Gets Attached Windows Width
     * @returns number
     */
    getWidth() {
        return this.width;
    }
    /**
     * @method getWindow Gets Attached Window
     * @returns fin.desktop.Window
     */
    getWindow() {
        return this.window;
    }
    /**
     * @method getIdealHeight Gets the "ideal Height" for the window
     * @returns number
     */
    getIdealHeight() {
        return this.idealHeight;
    }
    /**
     * @method getIdealWidth Gets the "ideal Width" for the window
     * @returns number
     */
    getIdealWidth() {
        return this.idealWidth;
    }
    /**
     * @method recalibrate Recalibrates the window, height, and width
     * @returns void
     */
    recalibrate() {
        this.window = fin.desktop.Window.getCurrent();
        this.height = window.innerHeight;
        this.width = window.innerWidth;
    }
    /**
     * @method setShowing set if the window is showing
     * @param showing boolean
     */
    setShowing(showing) {
        this.isShowing = showing;
        window.dispatchEvent(new CustomEvent('WindowShowingUpdate', { detail: { showing } }));
    }
    /**
     * @method getShowingStatus Gets the showing status of the window
     * @returns boolean
     */
    getShowingStatus() {
        return this.isShowing;
    }
    /**
     * @method instance Gets this WindowInfo instance on the window.
     * @returns WindowInfo
     */
    static get instance() {
        if (WindowInfo.singleton) {
            return WindowInfo.singleton;
        }
        else {
            return new WindowInfo();
        }
    }
}
exports.WindowInfo = WindowInfo;


/***/ }),

/***/ "./src/provider/ui/openfin.ts":
/*!************************************!*\
  !*** ./src/provider/ui/openfin.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const TrayMenu_1 = __webpack_require__(/*! ./TrayMenu */ "./src/provider/ui/TrayMenu.ts");
const WindowInfo_1 = __webpack_require__(/*! ./WindowInfo */ "./src/provider/ui/WindowInfo.ts");
class WindowManager {
    constructor() {
        this.windowInfo = new WindowInfo_1.WindowInfo();
        if (WindowManager.singleton) {
            return WindowManager.singleton;
        }
        this.setEventListeners();
        this.trayMenu = new TrayMenu_1.TrayMenu('https://openfin.co/favicon-32x32.png', this);
        WindowManager.singleton = this;
    }
    /**
     * @method setEventListeners Initalizes event listeners for the window
     * @returns void
     */
    setEventListeners() {
        // When window is ready
        window.addEventListener('DOMContentLoaded', this.onWindowLoad.bind(this));
        // On window close requested
        this.windowInfo.getWindow().addEventListener('close-requested', () => this.hideWindow());
        // On monitor dimension change
        fin.desktop.System.addEventListener('monitor-info-changed', this.sizeToFit.bind(this));
    }
    /**
     * @method onWindowLoad Fired when the window DOM is loaded
     * @returns void
     */
    onWindowLoad() {
        this.sizeToFit(false);
        document.getElementById('exitLink').addEventListener('click', () => this.hideWindow());
    }
    /**
     * @method sizeToFit Sets the window dimensions in shape of a side bar
     * @returns void
     */
    sizeToFit(forceShow = false) {
        fin.desktop.System.getMonitorInfo((monitorInfo) => {
            this.windowInfo.getWindow().setBounds(monitorInfo.primaryMonitor.availableRect.right - this.windowInfo.getIdealWidth(), 0, this.windowInfo.getIdealWidth(), monitorInfo.primaryMonitor.availableRect.bottom, () => {
                if (forceShow) {
                    this.showWindow();
                }
            }, (reason) => {
                console.warn('MOVED FAILED', reason);
            });
        });
    }
    /**
     * @method showWindow Shows the Window with Fade()
     * @returns void
     */
    showWindow() {
        this.fade(true, 450);
        this.windowInfo.getWindow().resizeBy(1, 0, 'top-left');
        this.windowInfo.getWindow().resizeBy(-1, 0, 'top-left');
        this.windowInfo.setShowing(true);
    }
    /**
     * @method hideWindow Hides the window with Fade()
     * @returns void
     */
    hideWindow() {
        this.fade(false, 450);
        this.windowInfo.setShowing(false);
    }
    /**
     * @method toggleWindow Hides or shows the center.
     * @returns void
     */
    toggleWindow() {
        if (this.windowInfo.getShowingStatus()) {
            this.hideWindow();
        }
        else {
            this.showWindow();
        }
    }
    /**
     * @method fade Fades the window in or out
     * @param fadeOut
     * @param timeout
     */
    fade(fadeOut, timeout) {
        if (fadeOut) {
            this.windowInfo.getWindow().show();
        }
        this.windowInfo.getWindow().animate({ opacity: { opacity: fadeOut ? 1 : 0, duration: timeout } }, { interrupt: false }, () => {
            !fadeOut ? this.windowInfo.getWindow().hide() : this.windowInfo.getWindow().focus();
        });
    }
    /**
     * @method instance Gets this WindowManager instance on the window.
     * @returns WindowManager
     */
    static get instance() {
        if (WindowManager.singleton) {
            return WindowManager.singleton;
        }
        else {
            return new WindowManager();
        }
    }
}
exports.WindowManager = WindowManager;
// Run the window manager right away
new WindowManager(); // tslint:disable-line:no-unused-expression


/***/ })

/******/ });
//# sourceMappingURL=openfin-bundle.js.map