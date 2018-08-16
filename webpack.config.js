const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const outputDir = path.resolve(__dirname, './build')

/**
 * creates a webpack config for the UI (provider UI aka notification center)
 * @param {string} projectPath The path to the project
 * @param {string} entryPoint The entry point to the application,
 *  usually a js file
 * @return {Object} A webpack module for the project
 */
function createWebpackConfigForProviderUI(projectPath, entryPoint) {

    return Object.assign({
        entry: entryPoint,
        output: {
            path: outputDir + '/ui/pack',
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
        plugins: [new MiniCssExtractPlugin({ filename: 'bundle.css' })]
    });
}

/**
 * build rudimentary webpack config for typescript (client/provider)
 * @param {string} infile The entry point to the application (usually a js file)
 * @param {string} outfile The name of the packed output file
 * @return {Object} A webpack module
 */
function createWebpackConfigForTS(infile, outfile) {
    return Object.assign({
        entry: infile,
        output: {
            path: outputDir,
            filename: outfile + '.js'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader'
                }
            ]
        }
    });
}

/**
 * build webpack config for the provider side
 * @return {Object} A webpack module
 */
function createWebpackConfigForProvider() {
    return Object.assign(
        createWebpackConfigForTS('./src/provider/index.ts', 'provider'),
        { 
            plugins: [
                new CopyWebpackPlugin([
                    { from: './src/ui', to: 'ui/' },
                    { from: './src/provider.html' }
                ]),
                new CopyWebpackPlugin([
                    { from: './src/app.template.json', to: 'app.json', transform: (content) => {
                        const config = JSON.parse(content);
                        const newConfig = prepConfig(config);
                        return JSON.stringify(newConfig);
                    }}
                ])
            ]
        }
    )
}

function prepConfig(config) {
    const newConf = Object.assign({}, config);
    if (typeof process.env.GIT_SHORT_SHA != 'undefined' && process.env.GIT_SHORT_SHA != "" ) {
        newConf.startup_app.url = 'https://cdn.openfin.co/services/openfin/notifications/' + process.env.GIT_SHORT_SHA + '/provider.html';
        newConf.startup_app.autoShow = false;
    } else if (typeof process.env.CDN_ROOT_URL != 'undefined' && process.env.CDN_ROOT_URL != "" ) {
        newConf.startup_app.url = process.env.CDN_ROOT_URL + '/provider.html';
    } else {
        newConf.startup_app.url = 'http://localhost:9048/provider.html';
    }
    return newConf;
}

/**
 * Modules to be exported
 */
module.exports = [
    createWebpackConfigForProvider(),
    createWebpackConfigForProviderUI('Service/UI', {
        react: './src/ui/js/index.tsx',
        serviceui: './src/ui/index.ts',
        openfin: './src/ui/js/openfin.ts',
        toast: './src/ui/js/toast/index.tsx'
    }),
];
