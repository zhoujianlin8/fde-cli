/**
 * Created by jianlin.zjl on 15-4-2.
 */
var exec = require('child_process').exec;
module.exports = {
  prompts:[
  /*  {
      type: 'input',
      name: 'group',
      message: '该项目所属 gitlab 上的组',
      default: 'cm'
    },*/
    {
      type: 'confirm',
      name: 'isCom',
      message: '是否是组件',
      default: true
    }
  ],
  end: function(data,cb){
    var data = data || {};
    data.author = '';
    exec('git config --list', function (err, stdout, stderr) {
      var reg = /user\.name=([^\n]+)\nuser\.email=([^\n]+)/,
        match = stdout.match(reg);
      if (match) {
        data.author = match[1];
        data.email = match[2]
      }else{
        data.author = '';
        data.email = '';
      }
      cb && cb(data);
    });
  }
};