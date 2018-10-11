const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/**
 * creates a webpack config for the UI (provider UI aka notification center)
 * @param {string} projectPath The path to the project
 * @param {string} entryPoint The entry point to the application,
 *  usually a js file
 * @return {Object} A webpack module for the project
 */
function createWebpackConfigForProviderUI(entryPoint) {

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, './build/ui/pack'),
            filename: '[name]-bundle.js'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        devtool:'source-map',
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        "css-loader"
                    ]
                },
                {
                    test: /\.(png|jpg|gif|otf|svg)$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 8192
                            }
                        }
                    ]
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader'
                }

            ]
        },
        plugins: [
            new MiniCssExtractPlugin({ filename: 'bundle.css' }),
            new CopyWebpackPlugin([
                { from: './src/ui', to: '..', ignore: ["**/*.ts", "**/*.tsx"] }
            ])
        ]
    });
}

function createWebpackConfigForProvider() {
    return {
        entry: './staging/src/provider/index.js',
        output: {
            path: path.resolve(__dirname, './build'),
            filename: 'provider.js'
        },
        devtool:'source-map',
        plugins: [
            new CopyWebpackPlugin([
                { from: './src/provider.html' }
            ]),
            new CopyWebpackPlugin([
                { from: './src/app.template.json', to: 'app.json', transform: (content) => {
                    const config = JSON.parse(content);
                    const newConfig = prepConfig(config, 'http://localhost:9048/provider.html');
                    return JSON.stringify(newConfig, null, 4);
                }}
            ])
        ]
    }
}

function createWebpackConfigForDemo(entryPoint) {
    return {
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, './build/demo'),
            filename: '[name].js'
        },
        resolve: {
            extensions: ['.ts']
        },
        devtool:'source-map',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader'
                }
            ]
        },
        plugins: [
            new CopyWebpackPlugin([
                { from: './src/demo/app-launcher.html'},
                { from: './src/demo/app.css'},
                { from: './src/demo/app.html'}
            ]),
            new CopyWebpackPlugin([
                { 
                    from: './src/demo/app-launcher.json', 
                    transform: (content) => {
                        const config = JSON.parse(content);
                        const newConfig = prepConfig(config, 'http://localhost:9048/demo/app-launcher.html');
                        return JSON.stringify(newConfig, null, 4);
                    }
                }
            ])
        ]
    };
}

function prepConfig(config, defaultUrl) {
    const newConf = Object.assign({}, config);
    if (typeof process.env.SERVICE_VERSION != 'undefined' && process.env.SERVICE_VERSION != "" ) {
        newConf.startup_app.url = 'https://cdn.openfin.co/services/openfin/notifications/' + process.env.SERVICE_VERSION + '/provider.html';
        newConf.startup_app.autoShow = false;
    } else if (typeof defaultUrl != 'undefined' && defaultUrl != "" ) {
        newConf.startup_app.url = defaultUrl;
    }
    return newConf;
}

/**
 * Modules to be exported
 */
module.exports = [
    createWebpackConfigForProvider(),
    createWebpackConfigForProviderUI({
        react: './src/ui/js/index.tsx',
        serviceui: './src/ui/index.ts',
        openfin: './src/ui/js/openfin.ts',
        toast: './src/ui/js/toast/index.tsx'
    }),
    createWebpackConfigForDemo({
        app: './src/demo/app.ts',
        'app-launcher': './src/demo/app-launcher.ts'
    }),
];
