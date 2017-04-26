## detail-toolkit 工具
####主要特点



### 安装

```
$ tnpm install -g @ali/detail-toolkit

```

### 使用过程

`````
 mkdir my-new-project && cd $_
 detail init(初始化项目 )
 detail start（开启项目）
 detail build（打包）
 detail test （自行实现）
 detail publish （自行实现）
`````


### 命令使用
* detail start [p/name]--某页面 开启项目
* detail build [p/name]--某页面打包项目
* detail init [url?] 项目初始化 后面参数实现自定义初始化
* 项目使用
* detail data [name][type?]
* detail p [name] 创建页面
* detail c [name]  创建components


### detail 组件目录

```
      m-xxx            // 目录名, 小写, 多字符用 – 分隔
         |-----mock      // 模拟数据文件
         |-----build    // 用于存放需要cdn发布的文件
         |-----test     // 单元测试放的目录
         |-----lib    // 转es6代码
         |----- demo  //demo文件
         |      |--- index.css
         |      |--- index.html
         |      |--- index.js
         |-----src
         |      |--- mod
         |      |--- index.js //主入口文件
         |      |--- index.css
         |-----README.md    // 用于介绍项目文档
         |-----detail-config.js     //配置文件
```



## 项目目录规范

```
  m-xxx            // 目录名, 小写, 多字符用 – 分隔
     |-----data      // 模拟数据文件
     |-----build    // 用于存放需要cdn发布的文件
     |-----test     // 单元测试放的目录
     |-----src
     |      |---c    //项目通用组件
     |      |   |---util//项目js 共用文件夹
     |      |   |     |------index.js  //项目通用js模块
     |      |   |     |------apimap.js //项目url api 管理模块
     |      |   |---css//项目css 共用文件夹
     |      |   |     |------common.less  //项目通用less模块
     |      |   |     |------reset.less //页面重置less
     |      |   |---index// index 项目通用组件
     |      |   |     |------index.js  //
     |      |   |     |------index.jsx.html  //
     |      |   |     |------index.less  //
     |      |---p   //业务代码
     |      |   |---index//index 页面目录
     |      |   |     |------lib  //页面其他模块
     |      |   |     |------index.html //页面主页面html
     |      |   |     |------index.js //页面js入口
     |      |---images  //图片目录copy
     |      |---fonts  //font目录字体copy   
     |      |---static //static目录静态资源copy
     |-----README.md    // 用于介绍项目文档
     |-----detail-config.js     //  配置文件
   
```
默认打包约定

````
['src/p/*/index.js','src/images/**','src/fonts/**','src/static/**']
````

### bug反馈 zhoujianlin8@gmail.com

