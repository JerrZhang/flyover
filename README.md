# flyover
flyover是一个简易的本地网络代理工具，基于Puppteer做网络拦截，可以实现对线上压缩代码的调试。

# 安装
- 安装nodejs 建议版本8.x
- 安装flyover
> npm install -g flyover

# 使用
+ 查看帮助
> flyover --help

  Usage: flyover add --path [file]

  Options:

    -v                output the version number
    -h, --help        output usage information

  Commands:

    add [options]     添加的文件会自动替换掉远程的同名文件
    start             启动flyover服务
    config [options]  添加用户配置
    list              列出已添加的文件


# 使用步骤
+ 配置需要拦截网站地址
>flyover config --url https://www.demo.com

执行flyover config -h 查看config 命令帮助详情
 

  Usage: config [options]

  添加用户配置

  Options:

    -u,--url    设置用户要访问的url
    -h, --help  output usage information

+ 添加要拦截替换的文件
> flyover add --path xxx.fle 

执行flyover add --help 查询add 命令详情

Usage: add [options]

  添加的文件会自动替换掉远程的同名文件

  Options:

    -p,--path   添加的文件路径,默认当前路径
    -h, --help  output usage information

+ 启动服务

> flyover start 