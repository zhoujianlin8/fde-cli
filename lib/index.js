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
            console.log('当前目录 fde.config.js不存在，请切换正确目录');
            process.exit(0)
        }
    },
    getBabel: function (options) {
        return options.babelOptions || {
                //cache: '.cache',
                /*presets: [
                 "es2015",
                 "react",
                 "stage-0"
                 ]*/
                presets: [require("babel-preset-es2015"), options.isReact !== false ? require("babel-preset-react") : null, require("babel-preset-stage-0")]
            };
    },
    getPlugins: function (defaultWebpackOption, options) {
        var plugins = defaultWebpackOption.plugins || [];
        var uglifyConfig = options.uglifyConfig || {
                compress: {
                    unused: true,
                    dead_code: true,
                    warnings: false
                },
                //不进行混淆
                mangle: {
                    except: ['$', 'exports', 'require', 'module', 'define']
                }
            };
        options.isBuild && options.isMinify && plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));


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
        if (options.isExtractCSS !== false) {
            var ExtractTextPlugin = require('extract-text-webpack-plugin');
            plugins.push(
                new ExtractTextPlugin({
                    filename: '[name].css',
                    allChunks: true
                })
            );
        }
        var arrCommonsChunk = options.arrCommonsChunk || [];
        arrCommonsChunk && !util.isArray(arrCommonsChunk) && (arrCommonsChunk = [arrCommonsChunk]);
        if (options.isCommon === true) {
            var basePath = '';
            if (options.isCom) {
                basePath = 'demo';
            } else {
                if (!options.isBuild) {
                    basePath = options.srcBase;
                }
            }
            arrCommonsChunk.push({
                filename: basePath + '/common.js',
                name: 'common'
            })
        }

        arrCommonsChunk.forEach(function (item) {
            item && plugins.push(new webpack.optimize.CommonsChunkPlugin(item));
        });
        return plugins;
    },
    getLoader: function (options) {
        function getUse(arr) {
            if (options.isExtractCSS !== false) {
                var ExtractTextPlugin = require('extract-text-webpack-plugin');
                return ExtractTextPlugin.extract({use: arr})
            }
            return arr;
        }

        var that = this;
        var postcss = {
            loader: 'postcss-loader',
            options: {
                plugins: (loader) => [
                    require('autoprefixer')(),
                ]
            }
        };
        return [
            {
                test: /\.less$/,
                use: getUse(['css-loader', 'less-loader', postcss])
            }, {
                test: /\.scss$/,
                use: getUse(['css-loader', 'sass-loader', postcss])
            }, {
                test: /\.css$/,
                use: getUse(['css-loader', postcss])
            },
            {
                test: /\.(jst|ejs)(\.html)?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ejs-loader',
                }
            },
            {
                test: /\.(svg|png|gif|jpg)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'url-loader',
                    options: {
                        // 低于10K到资源文件直接打包在js里使用base64
                        limit: 10240
                    }
                }
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: that.getBabel(options)
                }
            },
        ]

    },

    getEntry: function (options) {
        var entryObj = {};
        var args = options.args || [];
        var self = this;
        var baseSrc = path.join(cwdPath, options.srcBase);
        if (options.isCom) {
            glob.sync(['demo/*.js', 'demo/!*.jsx'], {cwd: cwdPath}).forEach(function (item, b) {
                var key = path.join(cwdPath, item.replace(/\.(jsx|js)$/g, ''));
                if (options.isBuild && options.buildTo) {
                    key = key.replace(path.join(cwdPath, 'demo'), 'demo')
                }
                entryObj[key] = self.hotFile(options, path.join(cwdPath, item));
            });
        } else {
            var arrsync = ['p/*/index.js', 'p/*/index.jsx'];
            //fie start p/index
            var page = process.env.PAGE;
            if (page && fs.existsSync(path.join(baseSrc,'p',page))) {
                arrsync = ['p'+page+'index.js','p'+page+'index.jsx']
            }
            glob.sync(arrsync, {cwd: baseSrc}).forEach(function (item, b) {
                var key = path.join(options.isBuild ? '' : options.srcBase, item.replace(/\.(jsx|js)$/g, ''));
                if(options.isBuild && options.isOneDir){
                    key = key.replace(/[\\\/]/g,'_')
                }
                entryObj[key] = self.hotFile(options, path.join(baseSrc, item));
            });
        }
        //module
        var commonModules = options.commonModules || [];
        if (options.isCommon === true || commonModules.length) {
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
        var loaders = webpackConfig.module.rules;
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
        var self = this;
        options.isBuild = isBuild;
        options.isServer = isServer;
        options.args = RX.args;
        return new Promise(function (reslove) {
            var baseSrc = path.join(cwdPath, options.srcBase);
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
            var moduleObj = {
                rules: self.getLoader(options)
            };
            var alias = util._extend({
                'c': path.join(cwdPath, 'src/c'),
            }, options.alias || {});

            var webpackConfig = {
                output: output,
                resolve: {
                    //root: cwdPath,
                    // modules: cwdPath,
                    extensions: ['.js', '.jsx'],
                    alias: alias
                },
                resolveLoader: {modules: [path.join(__dirname, "../node_modules"), path.join(cwdPath, "node_modules"),]},
                entry: self.getEntry(options),
                module: moduleObj,
            };
            webpackConfig.externals = options.externals || {};
            var serverDefaultConfig = {
                plugins: [
                    new webpack.NoEmitOnErrorsPlugin(),
                    new webpack.LoaderOptionsPlugin({
                        debug: true
                    })
                ],
                cache: true,
                devtool: 'source-map'
            };

            var buildDefaultConfig = {
                plugins: [new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("production")}})],
                cache: true,
                devtool: false
            };
            webpackConfig = isBuild ? util._extend(webpackConfig, buildDefaultConfig) : util._extend(webpackConfig, serverDefaultConfig);
            webpackConfig.plugins = self.getPlugins(webpackConfig, options);
            RX.webpackConfig = webpackConfig;
            //happy 需要在最后添加
            if (util.isFunction(RX.config.getWebpackConfig)) {
                var config = RX.config.getWebpackConfig(RX) || webpackConfig;
                if (util.isFunction(config.then)) {
                    config.then(function (data) {
                        reslove(self.happypack(data || webpackConfig, options))
                    })
                } else {
                    reslove(self.happypack(webpackConfig, options));
                }
            } else {
                reslove(self.happypack(webpackConfig, options));
            }
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