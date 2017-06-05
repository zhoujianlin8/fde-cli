/**
 * Created by jianlin.zjl on 15-4-15.
 */
var util = require('util');
var fs = require('fs');
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
  doArrDone([copy,doWebpack,addBuild]);
  function addBuild(callback){
    if(util.isFunction(config.addBuild)){
      RT.doneCallback(config.addBuild,RT,callback)
    }else{
      callback();
    }
  }
  function copy(callback) {
    var mkdirp = RT.mkdirp;
    var distPath = path.join(cwdPath,options.buildTo);
    var arr = glob.sync(['images/**','fonts/**','static/**'],{cwd: srcBase});
    arr.forEach(function (item) {
      var file = path.join(srcBase,item);
      var dist = path.join(distPath,item);
      if(fs.statSync(file).isDirectory()){
        return  mkdirp(path.dirname(dist), 511 /* 0777 */, function (err) {
          end();
        })
      }
      var content = fs.readFileSync(file);
      mkdirp(path.dirname(dist), 511 /* 0777 */, function (err) {
        fs.writeFileSync(dist, content);
        end();
      });
    });
    var index = 0;
    var len = arr.length;
    function end() {
      index++;
      if(index >= len){
        callback();
      }
    }
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
    })
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
