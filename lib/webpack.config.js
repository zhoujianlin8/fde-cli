var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var util = require('util');
var envCli = process.envCli;
/*var cssModulesLoader = [
    'css-loader?sourceMap&-minimize',
    'modules',
    'importLoaders=1',
    'localIdentName=[name]__[local]'
].join('&');*/
var webpackConfig = {
    options: {
        isCom: true,
        open: '/demo/index.html',
        port: 8082
    },
   
    output: {
        path: __dirname,
        publicPath: '/',
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    resolveLoader: {
        modules: [__dirname + '/node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            }, {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }, {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    cacheDirectory: '.cache',
                    // plugins: ['add-module-exports'],
                    presets: ['es2015', 'react', 'stage-0']
                }
            }],
    }
}

//new ExtractTextPlugin
var serverDefaultConfig = {
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.LoaderOptionsPlugin({
            debug: true
        })
        /* new ExtractTextPlugin({
         filename: "[name].css",
         allChunks: true
         }),*/
    ],
    entry: {
        'demo/index': [path.join(__dirname, 'demo/index.js')]
    },
    cache: true,
    devtool: 'source-map'
};

var buildDefaultConfig = {
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                unused: true,
                dead_code: true,
                warnings: false
            },
            //不进行混淆
            mangle: {
                except: ['$', 'exports', 'require']
            }
        }),
        /* new ExtractTextPlugin({
         filename: "[name].css",
         allChunks: true
         }),*/
        new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("production")}})
    ],
    entry: {
        'build/index': [path.join(__dirname, 'demo/index.js')]
    },
    cache: true,
    devtool: false
};
if (envCli === 'start') {
    webpackConfig = util._extend(serverDefaultConfig, webpackConfig);
} else if (envCli === 'build') {
    webpackConfig = util._extend(buildDefaultConfig, webpackConfig);
    libs();
}

//复制lib打包代码
function libs() {
    // body...
    var babel = require('babel-core');
    var glob = require('glob');
    var fs = require('fs-extra');
    var cwd = process.cwd();
    var srcBase = path.join(cwd, 'src');
    var distBase = path.join(cwd, 'lib');
    var files = glob.sync('**/*.js', {cwd: srcBase});

    files.forEach((file)=> {
        var result = babel.transformFileSync(path.join(srcBase, file), {
            presets: ['es2015', 'react', 'stage-0'],

        });
        let outFile = path.join(distBase, file);
        // console.log(outFile);
        fs.outputFileSync(outFile, result.code)
    })


    var styles = glob.sync('**/*.@(scss|less|css)', {cwd: srcBase});
    styles.forEach((style)=> {
        fs.copySync(path.join(srcBase, style), path.join(distBase, style))
    })

}


module.exports = webpackConfig;