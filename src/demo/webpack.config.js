const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function createConfig(projectPath, entryPoint) {

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, '../../dist/demo'),
            filename: projectPath + '.js'
        },
        resolve: {
            extensions: ['.js']
        },
        plugins: [
            new CopyWebpackPlugin([
                { 
                    from: 'apps.json', 
                    transform: (content) => {
                        const config = JSON.parse(content);
                        config.startup_app.url = getAppStartupUrl('app.html');
                        return JSON.stringify(config);
                    }
                }
            ]),
            new CopyWebpackPlugin([
                { 
                    from: 'provider.json', 
                    transform: (content) => {
                        const config = JSON.parse(content);
                        config.startup_app.url = getAppStartupUrl('provider.html');
                        return JSON.stringify(config);
                    }
                }
            ])
        ]
    });
}

function getAppStartupUrl(page) {
    if (typeof process.env.GIT_SHORT_SHA != 'undefined' && process.env.GIT_SHORT_SHA != "" ) {
        return 'https://cdn.openfin.co/services/openfin/notifications/' + process.env.GIT_SHORT_SHA + '/' + page;
    }
    return 'http://localhost:9048/' + page;
}

module.exports = [
    createConfig('app-bundle', './app.js')
];
