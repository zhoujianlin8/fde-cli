var pkg = require('./package.json');
module.exports = {
    name: pkg.name,
    vision: '@branch@', //版本号为分支号
    scripts: pkg.scripts, //执行任务
    options: {
        <%if(isReact){%>
        commonModules: ['react','react-dom'], //生成common.js
        isReact: true,
        <%}else{%>
        alias: {
            zepto: 'npm-zepto'
        },
        commonModules: ['npm-zepto'], //生成common.js
        <%}%>
        <%if(isCom){%>
        isCom: true, 
        open: '/demo/index.html',
        <%}%>
    }, //默认实现的配置参数
    plugins: {
        test: function (fde) {

        },
        publish: function (fde) {

        }
    }, //扩展命令插件
    //重写webpack配置
    getWebpackConfig(fde){
        //fde.env 区分start build
        return fde.webpackConfig;
    },
    //build 过程添加执行
    addBuild(fde){

    },
    //添加 server 过程注入内容
    addServer(fde){

    }
    //...其他插件配置
};