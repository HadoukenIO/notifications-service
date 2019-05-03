const path = require('path');
const outputDir = path.resolve(__dirname, './dist');

const webpackTools = require('openfin-service-tooling').webpackTools;

module.exports = [
    webpackTools.createConfig(`${outputDir}/client`, './src/client/index.ts', {minify: false, isLibrary: true, libraryName: 'notifications'}, webpackTools.versionPlugin),
    webpackTools.createConfig(`${outputDir}/client`, './src/client/index.ts', {minify: true, isLibrary: true, libraryName: 'notifications', outputFilename: 'openfin-notifications'}, webpackTools.versionPlugin),
    webpackTools.createConfig(`${outputDir}/provider`, './src/provider/index.ts', undefined, webpackTools.manifestPlugin),
    webpackTools.createConfig(`${outputDir}/provider/ui`, {
        serviceui: './src/provider/view/NotificationCenterApp.tsx',
        openfin: './src/provider/controller/NotificationCenter.ts',
        toast: './src/provider/view/ToastApp.tsx'
    }),
    webpackTools.createConfig(`${outputDir}/demo`, {
        app: './src/demo/app.ts',
        launcher: './src/demo/launcher.ts'
    }, undefined, webpackTools.versionPlugin)
];
