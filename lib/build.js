/**
 * Created by jianlin.zjl on 15-4-15.
 */
var util = require('util');
var fs = require('fs-extra');
var path = require('path');
var cwdPath = process.cwd();
var RT = require('./rt');
RT.env = 'build'; //
var glob = RT.globby;
var webpack = require('webpack');
var lib = require('./index');
var config = RT.config;
module.exports = function (obj, cb) {
    var options = util._extend({
        buildTo: process.env.BUILD_DEST || 'build',
        isMinify: true,
        isOneDir: true,
        srcBase: 'src',
        inlineSource : true,
    }, config.options || {});
    var srcBase = path.join(cwdPath, options.srcBase);
    lib.configPathExists();
    RT.options = options; //区别config.options;

    var webpackConfig = lib.getWebpackConfig(RT);
    //var doArr = [copy, doWebpack, addBuild];
    var doArr = [];
    doArr.push(distHtml);
    options.isCom && doArr.push(toEs5);
    //test
    doArrDone(doArr);
    function addBuild(callback) {
        if (util.isFunction(config.addBuild)) {
            RT.doneCallback(config.addBuild, RT, callback)
        } else {
            callback();
        }
    }

    function distHtml(callback) {
        var baseSrc = srcBase;
        var arrsync = ['**/*.html', '!**/*.jst.html'];
        if(options.isCom){
            baseSrc = path.join(cwdPath,'demo');
        }else{
            var page = process.env.PAGE;
            if (page && fs.existsSync(path.join(baseSrc,'p',page))) {
                arrsync = ['p/'+page+'/*.html','!p/'+page+'/*.jst.html']
            }
        }
        var files = glob.sync(arrsync, {cwd: baseSrc});
        var i = 0;
        var len = files.length;
        if (!len) return callback();
        files.forEach((item) => {
            compileA(item);
        });
        function compileA(item) {
            var compile = require('ctool-html-compile').compile;
            new compile({
                filePath: path.join(baseSrc, item),
                isTms: false,
                name: config.name || '',
                group: config.group || '',
                version: config.version || '',
                transform: function (content, that) {
                    var reg = '([\'"]+)\\s?\\/' + options.srcBase + '\\/' + '([^\'"]+[\'"])';
                    var name = config.name.replace(/^@[^\\\/]+[\\\/]/g,'');
                    var outputPath = options.outputPath || '//' + (options.host || 'dev.cdn.myweimai.com/assets') + '/' + (config.group || 'm') + '/' + name + '/' + that.getVersion();
                    content = content.replace(/(['"=\s])http(s)?:/g, function (world, $1) {
                        return $1
                    });
                    content = content.replace(new RegExp(reg, 'g'), function (world, $1,$2) {
                        if(options.isOneDir){
                            $2 = $2.replace(/[\\\/]/g,'_')
                        }
                        return $1 + outputPath + '/' + $2;
                    }).replace(/(['"])([^'"]*)\/bower_components\//g, function (word, $1, $2) {
                        return $1 + outputPath + '/bower_components/';
                    }).replace(/(['"])([^'"]*)\/node_modules\//g, function (word, $1, $2) {
                        return $1 + outputPath + '/node_modules/';
                    });
                    if(options.isCom){
                        content = content.replace(/(['"])\s?\/(demo\/[^'"]+['"])/g,function (world,$1,$2) {
                            if(options.isOneDir){
                                $2 = $2.replace(/[\\\/]/g,'_')
                            }
                            return $1 + outputPath+'/'+$2
                        })
                    }
                    if(options.inlineSource){
                        content = inlineSource(content,outputPath,path.join(cwdPath, options.buildTo));
                    }
                    return content

                }
            }, function (err, content) {
                if(options.isOneDir){
                    item = item.replace(/[\\\/]/g,'_')
                }
                fs.outputFileSync(path.join(cwdPath, options.buildTo, item), content);
                i++;
                if (i >= len) {
                    callback();
                }
            });
        }
        //对于资源相对路径等不做任何处理  注释不区分
        function inlineSource(content,outputPath,distPath) {
            //<link rel="stylesheet" href="/src/p/pay/index.css" inline/>
            //<script type="text/javascript"  src="//m.myweimai.com/common_js/wm.js" inline></script>
            var reglink = /<link[^>]+href\s?=\s?['"]\s?([^>'"]+\.css)\s?['"][^>]*>/g;
            var reginline = /\sinline[\s'">\/]/;
            var regscript = /<script[^>]+src\s?=\s?['"]\s?([^>'"]+\.js)\s?['"][^>]*>/g;
            function doReg(reg,isLink) {
                content = content.replace(reg,function (word,$1) {
                    //inline
                    if(reginline.test(word)){
                        var newPath = $1.replace(outputPath,distPath);
                        if(newPath !== $1 &&  fs.existsSync(newPath)){
                            word = wrap(fs.readFileSync(newPath,'utf8'),isLink);
                            //http://
                        }else if(/^\/\//g.test($1)){
                            var request = require('sync-request');
                            var res = request('GET', 'http:'+$1);
                            word = wrap(res.getBody('utf8'),isLink);
                        }else if(fs.existsSync($1)){
                            word = wrap(fs.readFileSync($1,'utf8'),isLink);
                        }
                    }
                    return word
                })
            }
            function wrap(con,isLink) {
                if(isLink){
                    con = '<style type="text/css">'+con+'</style>'
                }else{
                    con = '<script type="text/javascript">' + con
                }
                return con
            }
            doReg(reglink,true);
            doReg(regscript);
            return content
        }
    }

    function toEs5(callback) {
        var babel = require('babel-core');
        var distBase = path.join(cwdPath, 'lib');
        var files = glob.sync('**/*.@(js|jsx)', {cwd: srcBase});
        files.forEach((file) => {
            var result = babel.transformFileSync(path.join(srcBase, file), lib.getBabel(options));
            var outFile = path.join(distBase, file);
            // console.log(outFile);
            fs.outputFileSync(outFile, result.code)
        })

        var styles = glob.sync('**/*.@(scss|less|css)', {cwd: srcBase});
        styles.forEach((style) => {
            fs.copySync(path.join(srcBase, style), path.join(distBase, style))
        });

        callback();
    }

    function copy(callback) {
        var mkdirp = RT.mkdirp;
        var distPath = path.join(cwdPath, options.buildTo);
        var arr = glob.sync(['images/**', 'fonts/**', 'static/**'], {cwd: srcBase});
        arr.forEach(function (item) {
            var file = path.join(srcBase, item);
             if(options.isOneDir){
                item = item.replace(/[\\\/]/g,'_')
             }
            var dist = path.join(distPath, item);
            fs.copySync(file, dist);

            /* if(fs.statSync(file).isDirectory()){
             return  mkdirp(path.dirname(dist), 511 /!* 0777 *!/, function (err) {
             end();
             })
             }
             var content = fs.readFileSync(file);
             mkdirp(path.dirname(dist), 511 /!* 0777 *!/, function (err) {
             fs.writeFileSync(dist, content);
             end();
             });*/


        });
        callback();
        /*var index = 0;
         var len = arr.length;
         function end() {
         index++;
         if(index >= len){
         callback();
         }
         }*/
    }

    function doWebpack(callback) {
        webpackConfig.then(function (config) {
            var compiler = webpack(config);
            compiler.run(function (err, stats) {
                if (err) {
                    console.log(err);
                }
                if (stats.compilation.errors.toString()) {
                    console.log(stats.compilation.errors.toString());
                }
                if (!err) {
                    var statsOptions = {
                        hash: false,
                        timings: true,
                        chunks: false,
                        chunkModules: false,
                        modules: false,
                        children: true,
                        version: true,
                        cached: false,
                        cachedAssets: false,
                        reasons: false,
                        source: false,
                        errorDetails: false
                    };
                    console.log(stats.toString(statsOptions));
                }
                callback(err);
            });
        }).catch(function (e) {
            console.log(e)
        });
    }

    function doArrDone(arr) {
        var len = arr.length;
        arr.forEach(function (item) {
            item(done)
        });
        var index = 0;
        var errors = [];

        function done(err) {
            if (err) errors.push(err);
            index++;
            if (index >= len) {
                cb && cb(errors.length);
            }
        }
    }
};
