const path = require('path');

function createConfig(projectPath, entryPoint) {

    return Object.assign({
        entry: entryPoint,
        output: {
            path: path.resolve(__dirname, '../../dist/demo'),
            filename: projectPath + '.js'
        },
        resolve: {
            extensions: ['.js']
        }        
    });
}

module.exports = [
    createConfig('client-bundle', './appClient.js')
];
