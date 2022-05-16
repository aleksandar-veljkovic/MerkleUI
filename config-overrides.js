const webpack = require("webpack");
const path = require("path");

module.exports = function override (config) {
    let loaders = config.resolve
    loaders.fallback = {
        "path": false,
        "os": false,
        "fs": false,
        "util": false,
        "url": false,
        "assert": false,
        "stream": false,
        "zlib": false,
        "http": false,
        "crypto": false,
    };

    config.resolve.alias = { util$: path.resolve(__dirname, 'node_modules/util') };


    config.plugins.push(
        new webpack.DefinePlugin({
            process: {env: {}, browser: true}
        })
    )
    
    return config;
}