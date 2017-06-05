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
        commonModules: ['zepto'] //生成common.js
        <%}%>
        <%if(isCom){%>
            isCom: true
        <%}%>
    }, //默认实现的配置参数
    plugins: {
        test: function (com) {

        },
        publish: function (com) {

        }
    }, //扩展命令插件
    //重写webpack配置
    getWebpackConfig(com){
        //com.env 区分start build
        return com.webpackConfig;
    },
    //build 过程添加执行
    addBuild(com){

    },
    //添加 server 过程注入内容
    addServer(com){

    }
    //...其他插件配置
};