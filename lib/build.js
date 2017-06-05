/**
 * Created by jianlin.zjl on 15-4-15.
 */
var util = require('util');
var fs = require('fs-extra');
var path  = require('path');
var cwdPath = process.cwd();
var RT = require('./rt');
RT.env = 'build'; //
var glob = RT.globby;
var webpack = require('webpack');
var lib = require('./index');
var config = RT.config;
module.exports = function (obj,cb) {
  var options = util._extend({
    buildTo: process.env.BUILD_DEST || 'build',
    isMinify: true,
    srcBase: 'src',
  },config.options || {});
  var srcBase = path.join(cwdPath,options.srcBase);
  lib.configPathExists();
  RT.options = options; //区别config.options;

  var webpackConfig = lib.getWebpackConfig(RT);
  var doArr = [copy,doWebpack,addBuild];
  options.isCom && doArr.push(toEs5);
  doArrDone(doArr);
  function addBuild(callback){
    if(util.isFunction(config.addBuild)){
      RT.doneCallback(config.addBuild,RT,callback)
    }else{
      callback();
    }
  }

  function toEs5(callback) {
      var babel = require('babel-core');
      var distBase = path.join(cwdPath, 'lib');
      var files = glob.sync('**/*.@(js|jsx)', {cwd: srcBase});
      files.forEach((file)=> {
          var result = babel.transformFileSync(path.join(srcBase, file), lib.getBabel(options));
          var outFile = path.join(distBase, file);
          // console.log(outFile);
          fs.outputFileSync(outFile, result.code)
      })

      var styles = glob.sync('**/*.@(scss|less|css)', {cwd: srcBase});
      styles.forEach((style)=> {
          fs.copySync(path.join(srcBase, style), path.join(distBase, style))
      });

      callback();
  }
  function copy(callback) {
    var mkdirp = RT.mkdirp;
    var distPath = path.join(cwdPath,options.buildTo);
    var arr = glob.sync(['images/**','fonts/**','static/**'],{cwd: srcBase});
    arr.forEach(function (item) {
      var file = path.join(srcBase,item);
      var dist = path.join(distPath,item);
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
      compiler.run(function (err,stats) {
          if (err) {
          console.log(err);
        }
        if (stats.compilation.errors.toString()) {
          console.log(stats.compilation.errors.toString());
        }
        if(!err){
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
      if(err) errors.push(err);
      index ++ ;
      if(index >= len){
          cb && cb(errors.length);
      }
    }
  }
};
