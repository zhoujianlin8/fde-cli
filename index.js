var util = require('util');
var path = require('path');
var fs = require('fs');
var xtUtil = require('ginit');
var ginit = xtUtil.init;
var template = xtUtil.template;
var cwdPath = process.cwd();
var templatePath = path.join(__dirname, './template');
var rewrite = xtUtil.rewrite;
var RT = require('./lib/rt');
var abc = RT.config;
var options = util._extend({
    srcBase: 'src'
}, abc.options || {});
var srcBase = path.join(cwdPath, options.srcBase);
var Tasks = module.exports;

//项目初始化
Tasks.init = function (str) {
    if (fs.existsSync(RT.configPath)) {
        console.log('项目已存在初始失败');
        return;
    }
    var dir = str ? str : path.join(templatePath, '/root');
    var data = getData();
    var self = this;
    ginit({
        dir: dir,
        data: data
    }, function (obj) {
        abc.options = abc.options || {};
        abc.options.isCom = obj.isCom;
        if(obj.isCom){
            var data = getData('demo'); //util._extend({isWeb: abc.options && abc.option.isWeb},getData(name));
            ginit({
                dir: path.join(templatePath, '/demo'),
                data: data,
                dist: path.join(cwdPath, 'demo')
            });
            data = getData(path.basename(cwdPath).replace('sanwant-',''));
            ginit({
                dir: path.join(templatePath, '/component'),
                data: data,
                dist: srcBase
            });

        }else{
            self.p('index');
        }
        console.log('项目初始成功');
        xtUtil.tnpmInstall({},function(err){
            if(err){
                console.error('tnpm install 自动执行出现问题， 请手动执行 tnpm install')
            }
        })
    })
};


Tasks.p = function (name) {
    if (!name) {
        return console.log('请输入页面名称')
    }
    if (fs.existsSync(path.join(srcBase, 'p', name))) {
        return console.log('页面已存在创建失败')
    }
    var data = getData(name); //util._extend({isWeb: abc.options && abc.option.isWeb},getData(name));
    data.pname = name;
    ginit({
        dir: path.join(templatePath, '/page'),
        data: data,
        dist: path.join(srcBase, 'p', name)
    })
};

//添加模块 
Tasks.c = function (name) {
    if (!name) {
        return console.log('请输入模块名称')
    }
    if (fs.existsSync(path.join(srcBase, 'c', name))) {
        return console.log('该模块已存在创建失败')
    }
    var data = getData(name);
    ginit({
        dir: path.join(templatePath, '/component'),
        data: data,
        dist: path.join(srcBase, 'c', name)
    })

};

//添加数据
Tasks.data = function (name, type) {
    var objType = {
        'form': 'form',
        'f': 'form',
        'list': 'list',
        'l': 'list',
        'submit': 'submit',
        's': 'submit',
        'index': ''
    };
    type = objType[type] || objType['index'];
    var data = getData(name);
    var key = data.cameledName;
    var dist = path.join(srcBase, 'data/' + key + '.json');
    if (fs.existsSync(dist)) {
        console.log('文件已经存在创建失败' + dist);
        process.exit(1);
        return;
    }
    //data
    template({
        file: path.join(templatePath, 'data/' + (type || 'submit') + '.json'),
        dist: dist,
        data: data
    });
    injectData(data);
};


Tasks.start = function () {
    require('./lib/start').apply(null, arguments);
};

Tasks.build = function () {
    require('./lib/build').apply(null, arguments);
};


//获取数据
function getData(str) {
    var cameledName, classedName, scriptAppName, classname;
    scriptAppName = changeCameled(path.basename(cwdPath)) + 'App';
    cameledName = changeCameled(str);
    classedName = changeClassed(str);
    classname = classedName.toLowerCase();
    return util._extend(abc, {
        classname: classname, //全小写
        classedName: classedName, //大驼峰
        scriptAppName: scriptAppName, //项目app
        cameledName: cameledName,   //小驼峰
        isWeb: abc && abc.options && abc.options.isWeb,
        router: str
    });

    function changeClassed(str) {
        if (!str) return str || '';
        var arr = str.split(/(_|-|\/|\\)/g);
        arr = arr.filter(function (url) {
            return !/(_|-|\/|\\)/g.test(url)
        });
        var newArr = [];
        arr.forEach(function (item) {
            if (item) {
                newArr.push(item.substr(0, 1).toUpperCase() + item.slice(1));
            }
        });
        return newArr.join('');
    }

    function changeCameled(str) {
        if (!str) return str || '';
        str = changeClassed(str);
        return str.substr(0, 1).toLowerCase() + str.slice(1);
    }
}


function injectData(data) {
    var file = path.join(srcBase, 'c/util/apimap.js');
    if (fs.existsSync(file)) {
        var content = fs.readFileSync(file, {encoding: 'utf8'});
        var arr = [
            data.cameledName + ": {",
                "api: 'xxx',",
            "},"
        ];
        content = rewrite({
            needle: '/*invoke*/',
            splicable: arr,
            haystack: content,
            spliceWithinLine: false
        });
        console.log('file ' + file + ' inject success');
        fs.writeFileSync(file, content)
    }
}

