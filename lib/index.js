/**
 * Created by jianlin.zjl on 15-9-21.
 */
var fs = require('fs');
var cwdPath = process.cwd();
var glob = require('ginit').globby;
var path = require('path');
var webpack = require('webpack');
var util = require('util');
var os = require('os');
var RT = require('./rt');
module.exports = {
    configPathExists: function () {
        if (!fs.existsSync(RT.configPath)) {
            console.log('当前目录webpack.config.js 不存在，请切换正确目录');
            process.exit(0)
        }
    },
    getPlugins: function (defaultWebpackOption, options) {
        var plugins = defaultWebpackOption.plugins || [];
        var that = this;
        var uglifyConfig = options.uglifyConfig || {
                compress: {
                    unused: true,
                    dead_code: true,
                    warnings: false
                },
                //不进行混淆
                mangle: {
                    except: ['$', 'exports', 'require', 'module','define']
                }
            };
        options.isBuild && options.isMinify && plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));

        //options.isExternalOutPut === true && plugins.push();
        plugins.push(new webpack.optimize.OccurenceOrderPlugin());
        plugins.push(
            new webpack.ProgressPlugin(function (percentage, msg) {
                const stream = process.stderr;
                if (stream.isTTY && percentage < 0.71) {
                    stream.cursorTo(0);
                    stream.write(`📦   ${msg}`);
                    stream.clearLine(1);
                }
                //
                if (stream.isTTY && percentage >= 1) {
                    stream.write(`\n`);
                }
            })
        );
        options.isHot && plugins.push(new webpack.HotModuleReplacementPlugin());
        // defaultWebpackOption.ignoreModule && (plugins.push(new webpack.IgnorePlugin(new RegExp(defaultWebpackOption.ignoreModule))));
        if (options.isExtractCSS !== false) {
            var ExtractTextPlugin = require('extract-text-webpack-plugin');
            plugins.push(
                new ExtractTextPlugin('[name].css', {
                    allChunks: true
                })
            );
        }
        var arrCommonsChunk = options.arrCommonsChunk || [];
        arrCommonsChunk && !util.isArray(arrCommonsChunk) && (arrCommonsChunk = [arrCommonsChunk]);
        if (options.isCommon === true && options.isAmdExternal !== true) {
            arrCommonsChunk.push({
                filename: options.isBuild ? '/common.js' : options.srcBase + '/common.js',
                name: 'common'
            })
        }

        arrCommonsChunk.forEach(function (item) {
            item && plugins.push(new webpack.optimize.CommonsChunkPlugin(item));
        });
        return plugins;
    },
    getLoader: function (options) {
        //js babel
        var loaders = [{
            test: /\.(js|jsx)$/,
            loader: 'babel-loader',
            exclude: options.jsExclude || /node_modules/, // js全部忽略babel
        }];
        //font url
        if (options.base64) {
            var limit = options.base64Limit || 10000; // 默认小于10k的资源base64化
            loaders.push({
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader?limit=' + limit + '&name=[name]-[hash].[ext]'
            });
        } else {
            loaders.push({
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'file-loader?name=[name]-[hash].[ext]'
            });
        }
        //css less

        var ExtractTextPlugin = require('extract-text-webpack-plugin');
        var localIdentName = options.localIdentName || '[local]___[hash:base64:5]';
        var urlDisables = options.urlDisables !== false; //url 不进行校验
        var cssLoader = options.isCssModule === true ? 'css-loader?' + (urlDisables ? '-url&' : '') + 'modules&importLoaders=1&localIdentName=' + localIdentName : 'css-loader' + (urlDisables ? '?-url' : '');
        var lessLoader = '!less-loader';//+self.getLessQuery(options);
        loaders.push({
            test: /\.css$/,
            loader: options.isExtractCSS !== false ? ExtractTextPlugin.extract('style-loader', cssLoader) : 'style-loader!' + cssLoader
        });
        loaders.push({
            test: /\.less/,
            loader: options.isExtractCSS !== false ? ExtractTextPlugin.extract('style-loader', cssLoader + lessLoader) : 'style-loader!' + cssLoader + lessLoader
        });


        return loaders
    },
    getEntry: function (options) {
        var entryObj = {};
        var args = options.args || [];
        var self = this;
        var baseSrc = path.join(cwdPath, options.srcBase);
        if (options.isCom) {
            /*  if(options.isCDN === true){
             glob.sync(['*.js','*.jsx'],{cwd: cwdPath}).forEach(function(item,b){
             var key = path.join(cwdPath,item.replace(/\.(jsx|js)$/g,''));
             if(options.buildTo){
             key = key.replace(cwdPath,path.join(cwdPath,options.buildTo))
             }
             entryObj[key] = self.hotFile(options,path.join(cwdPath,item));
             });
             }else{
             glob.sync(['demo/!*.js','demo/!*.jsx'],{cwd: cwdPath}).forEach(function(item,b){
             var key = path.join(cwdPath,item.replace(/\.(jsx|js)$/g,''));
             if(options.isBuild && options.buildTo){
             key = key.replace(path.join(cwdPath,'demo'),path.join(cwdPath,options.buildTo))
             }
             entryObj[key] = self.hotFile(options,path.join(cwdPath,item));
             });
             }*/

        } else {
            var arrsync = ['p/*/index.js', 'p/*/index.jsx'];
            //fie start p/index
            if (/^p[\\\/]/g.test(args[0] + '') && fs.existsSync(path.join(baseSrc, args[0]))) {
                arrsync = [args[0] + '/index.js', args[0] + '/index.jsx']
            }
            glob.sync(arrsync, {cwd: baseSrc}).forEach(function (item, b) {
                var key = path.join(options.isBuild ? '' : options.srcBase, item.replace(/\.(jsx|js)$/g, ''));
                entryObj[key] = self.hotFile(options, path.join(baseSrc, item));
            });
        }
        //module
        var commonModules = options.commonModules || [];
        if (options.isAmdExternal !== true && options.isCommon === true || commonModules.length) {
            options.isCommon = true;
            entryObj['common'] = commonModules;
        }
        return entryObj;
    },
    getVersion: function (v) {
        if (!v || v === '@branch@') {
            var headerFile = path.join(cwdPath, '.git/HEAD');
            var gitVersion = fs.existsSync(headerFile) && fs.readFileSync(headerFile, {encoding: 'utf8'}) || '';
            var arr = gitVersion.match(/(\d+\.\d+\.\d+)/g);
            v = arr && arr[0] || '0.0.1';
        }
        return v;
    },
    hotFile: function (options, file) {
        if (options.isHot) {
            var clientPath = path.join(__dirname, '../node_modules/koa-webpack-hot-middleware/node_modules/webpack-hot-middleware/client.js');
            if (!fs.existsSync(clientPath)) {
                clientPath = path.join(__dirname, '../node_modules/webpack-hot-middleware/client');
            }
            var hotMiddlewareScript = clientPath + '?path=/__webpack_hmr&timeout=20000' + (options.isReload !== false ? '&reload=true' : '');
            return [file, hotMiddlewareScript]
        }
        return file;
    },
    happypack: function (webpackConfig, options) {
        if (options.isHappy === false) return webpackConfig;
        if (options.isBuild) {
            this.happypackTip();
        }
        var HappyPack = require('happypack');
        var loaders = webpackConfig.module.loaders;
        var osLen = os.cpus().length;
        var reg = /\.([^$?]+)/;
        for (var i = 0, len = loaders.length; i < len; i++) {
            var loader = loaders[i];
            var str = loader['test'].toString();
            var id = str.match(reg)[1];
            if (id != 'js') {
                continue;
            }
            loader['happy'] = {
                id: id
            };
            var plugin = generatePlugin(id, loader['loader']);
            webpackConfig.plugins.push(plugin);
        }
        function generatePlugin(id) {
            return new HappyPack({
                id: id,
                cache: true,
                verbose: true,
                threads: osLen
            })
        }

        return webpackConfig;
    },
    happypackTip: function () {
        var cwd = cwdPath;
        var ignoreContent = '';
        var ignorePath = path.join(cwd + path.sep + '.gitignore');
        try {
            ignoreContent = fs.readFileSync(ignorePath);
        } catch (err) {
            if (err.code == 'ENOENT') {
                fs.writeFileSync(ignorePath, '.happypack');
                console.log('仓库不包含 .gitignore 文件，自动添加 \".happypack\" 避免服务器上打包采用缓存配置');
                return;
            } else {
                throw err;
            }
        }
        ignoreContent = ignoreContent.toString();
        if (ignoreContent.indexOf('.happypack') == -1) {
            fs.writeFileSync(ignorePath, ignoreContent + '\n' + '.happypack');
            console.error('仓库 .gitignore 文件不包含 \".happypack\" 内容，自动添加 \".happypack\" 避免服务器上打包采用缓存配置');
        }
    },

    getWebpackConfig: function (RX) {
        var options = RX.options;
        var isBuild = RX.env === 'build';
        var isServer = RX.env === 'start';
        options.isBuild = isBuild;
        options.isServer = isServer;
        options.args = RX.args;
        return new Promise(function (reslove) {
            config = util._extend({},RX.config);
            delete config['options'];
            reslove(config);
           /* var baseSrc = path.join(cwdPath, options.srcBase);
            var outputPath = '';
            if (isBuild && options.buildTo) {
                outputPath = path.join(cwdPath, options.buildTo);
            } else if (options.isCom) {
                outputPath = cwdPath;
            } else {
                outputPath = baseSrc;
            }
            var output = {
                path: outputPath,
                publicPath: '/',
                filename: '[name].js',
                chunkFilename: '[id].chunk.js'
            };
            //isServer && (output.publicPath = '//'+self.getIPAddress()+':'+options.port+'/');

            /!*   options.isOutputUmd && (output.libraryTarget = 'umd');
             var jsExclude = /node_modules[\\\/](?!clustars-com)/;
             if(options.jsExclude){
             jsExclude = new RegExp(options.jsExclude)
             }*!/

            var moduleObj = {
                loaders: self.getLoader(options)
            };

            var alias = util._extend({
                'c': path.join(cwdPath, 'src/c')
            }, options.alias || {});
            var babel = util._extend({
                babelrc: false,
                cacheDirectory: true,
                plugins: [require("babel-plugin-add-module-exports")],
                presets: [require('babel-preset-react'), require('babel-preset-es2015'), require('babel-preset-stage-0')]
            },options.babel);
            var webpackConfig = {
                output: output,
                resolve: {
                    root: cwdPath,
                    extensions: ['', '.js', '.jsx'],
                    alias: alias
                },
                resolveLoader: {root: path.join(__dirname, "../node_modules")},
                entry: self.getEntry(options),
                module: moduleObj,
                //externals: options.externals || {},
                babel: babel
            };
         /!*   if(options.isAmdExternal !== true){
                webpackConfig.externals = options.externals || {};
            }*!/
            var serverDefaultConfig = {
                plugins: [
                    new webpack.NoErrorsPlugin()
                ],
                cache: true,
                debug: true,
                devtool: 'source-map'
            };

            var buildDefaultConfig = {
                plugins: [new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("production")}})],
                cache: true,
                debug: false,
                devtool: false
            };
            webpackConfig = isBuild ? util._extend(webpackConfig, buildDefaultConfig) : util._extend(webpackConfig, serverDefaultConfig);
            webpackConfig.plugins = self.getPlugins(webpackConfig, options);

            //happy 需要在最后添加
            if (util.isFunction(RX.config.getWebpackConfig)) {
                var config = RX.config.getWebpackConfig(RX) || webpackConfig;
                if (util.isFunction(config.then)) {
                    config.then(function (data) {
                        reslove(self.happypack(data || webpackConfig, options))
                    })
                } else {
                    reslove(self.happypack(config, options));
                }
            } else {
                reslove(self.happypack(webpackConfig, options));
            }*/

        });
    },
    getIPAddress: function () {
        var ifaces = os.networkInterfaces();
        var ip = '';
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (ip === '' && details.family === 'IPv4' && !details.internal) {
                    ip = details.address;
                    return;
                }
            });
        }
        return ip || "127.0.0.1";
    }
};