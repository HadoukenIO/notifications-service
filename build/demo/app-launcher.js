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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/demo/app-launcher.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/demo/app-launcher.ts":
/*!**********************************!*\
  !*** ./src/demo/app-launcher.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

const numApps = 3;
const baseUrl = window.location.href.split('/').slice(0, -1).join('/');
console.log(`creating ${numApps} apps at: ${baseUrl}`);
fin.desktop.main(async () => {
    for (let i = 0; i < numApps; i++) {
        const conf = {
            'name': `OpenFin Notifications Demo App ${i}`,
            'uuid': `notifications-demoapp-${i}`,
            'url': `${baseUrl}/app.html`,
            'mainWindowOptions': {
                'defaultHeight': 420,
                'defaultWidth': 250,
                'defaultTop': 100 * i + 40,
                'defaultLeft': 100 * i + 40,
                'saveWindowState': false,
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


/***/ })

/******/ });
//# sourceMappingURL=app-launcher.js.map