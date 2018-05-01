const path = require('path');
//const es2015 = require('babel-preset-es2015');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const es2015 = require('babel-preset-es2015');
const react = require('react');
/**
 * creates a webpack config to be exported when npm run build in run
 * @param {string} projectPath The path to the project
 * @param {string} entryPoint The entry point to the application,
 *  usually a js file
 * @return {Object} A webpack module for the project
 */
function createWebpackConfigForProject(projectPath, entryPoint) {
    const includePathToProject = path.resolve(__dirname, `./src/${projectPath}`);

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, './dist/ui/pack'),
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
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: 'css-loader'
                    })
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
                },
                // {
                //     test: /\.jsx$/,
                //     include: [includePathToProject],
                //     loader: 'babel-loader',
                //     query: {
                //         presets: [react, es2015]
                //     }
                // },
                {
                    test: /\.js$/,
                    include: [includePathToProject],
                    loader: 'babel-loader',
                    query: {
                        presets: [es2015, "react"]
                    }
                }

            ]
        },
        plugins: [new ExtractTextPlugin({ filename: 'bundle.css' })]
    });
}

/**
 * creates a webpack config to be exported when npm run build in run
 * @param {string} projectPath The path to the project
 * @param {string} entryPoint The entry point to the application,
 *  usually a js file
 * @return {Object} A webpack module for the project
 */
function createWebpackConfigForProject2(projectPath, entryPoint) {
    const includePathToProject = path.resolve(__dirname, `./src/${projectPath}`);

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, './dist/'),
            filename: projectPath + '.js'
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
 * Modules to be exported
 */
module.exports = [
    createWebpackConfigForProject('Service/UI', {
        react: './src/ui/js/index.tsx',
        serviceui: './src/ui/index.ts',
        openfin: './src/ui/js/openfin.ts',
        toast: './src/ui/js/toast/index.tsx'
    }),
    createWebpackConfigForProject2('provider', './src/provider/index.ts'),
    createWebpackConfigForProject2('client', './src/client/index.ts')
];
