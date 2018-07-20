const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function createConfig(projectPath, entryPoint) {

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, '../../build/demo'),
            filename: projectPath + '.js'
        },
        resolve: {
            extensions: ['.js', '.ts']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader'
                }
            ]
        },
        plugins: [
            new CopyWebpackPlugin([
                { from: 'app-launcher.html' },
                { from: 'app.css' },
                { from: 'app.html' }
            ]),
            new CopyWebpackPlugin([
                { 
                    from: 'app-launcher.json', 
                    transform: (content) => {
                        const config = JSON.parse(content);
                        const newConfig = prepConfig(config);
                        return JSON.stringify(newConfig);
                    }
                }
            ])
        ]
    });
}

function prepConfig(config) {
    const newConf = Object.assign({}, config);
    if (typeof process.env.GIT_SHORT_SHA != 'undefined' && process.env.GIT_SHORT_SHA != "" ) {
        newConf.startup_app.url = 'https://cdn.openfin.co/services/openfin/notifications/' + process.env.GIT_SHORT_SHA + '/demo/app-launcher.html';
        newConf.startup_app.autoShow = false;
    } else if (typeof process.env.CDN_ROOT_URL != 'undefined' && process.env.CDN_ROOT_URL != "" ) {
        newConf.startup_app.url = process.env.CDN_ROOT_URL + '/demo/app-launcher.html';
    } else {
        newConf.startup_app.url = 'http://localhost:9048/demo/app-launcher.html';
    }
    return newConf;
}

module.exports = [
    createConfig('app', './app.ts'),
    createConfig('app-launcher', './app-launcher.ts')
];
