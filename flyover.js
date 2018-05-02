#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const URL = require('url');
const path = require('path');
const puppeteer = require('puppeteer');
const json = require('jsonfile');

function getUrl() {
    return new Promise((resolve, reject) => {
        json.readFile(path.resolve(__dirname, './config/config.json'), (err, obj) => {
            if (err) {
                reject(err);
            } else {
                resolve(obj.url);
            }
        })
    })
}

function setUrl(url) {
    return new Promise((resolve, reject) => {
        json.writeFile(path.resolve(__dirname, './config/config.json'), {
            url
        }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        })
    })
}

class DenyFile {
    constructor() {
        this.isDenyFile = false;
        this.fileContent = '';
    }

    getFileContent() {
        return this.fileContent;
    }

    setFileContent(content) {
        this.fileContent = content;
    }

    setIsDenyFile(isDenyFile) {
        this.isDenyFile = isDenyFile;
    }
    getIsDenyFile() {
        return this.isDenyFile;
    }


}

class Flyover {
    constructor() {
        this.wsEndpointUrl = '';
        this.browser = null;
        this.page = null;
    }

    _isInCtrllist(url, filelist) {
        let denyFile = new DenyFile();
        for (let file of filelist) {
            if (url.lastIndexOf(file) !== -1) {
                denyFile.setIsDenyFile(true);
                let content = fs.readFileSync(path.resolve(__dirname, `./ctrllist/${file}`)).toString();
                denyFile.setFileContent(content);
            }
        }
        return denyFile;
    }

    async getTargetUrl() {
        let url;
        try {
            url = await getUrl();
        } catch (error) {
            console.log(error);
        }

        return url;

    }
    async setTargetUrl(url) {
        if (url) {
            await setUrl(url);
        } else {
            console.log('url 不能为空');
        }
    }

    async start() {
        let targetUrl =await this.getTargetUrl();
        console.log(targetUrl);
        if (!targetUrl) {
            console.log('访问url不存在，请设置需要访问的url：flyover config --url http://demo.com');
        }
        //获取目录文件列表
        let ctrlsfiles = fs.readdirSync(path.resolve(__dirname, './ctrllist'));
        try {
            if (!this.wsEndpointUrl) {
                this.browser = await puppeteer.launch({
                    args: ['--no-sandbox'],
                    headless: false,
                    devtools: true
                });

                this.wsEndpointUrl = this.browser.wsEndpoint();
                this.browser.on('disconnected', () => {
                    this.wsEndpointUrl = '';
                })
            } else {
                this.browser = await puppeteer.connect({
                    browserWSEndpoint: this.wsEndpointUrl
                });
            }

            this.page = await this.browser.newPage();
            this.page.setRequestInterception(true);
            this.page.on('request', (req) => {
                console.log(req.url());
                let denyFile = this._isInCtrllist(req.url(), ctrlsfiles);
                if (denyFile.getIsDenyFile()) {
                    req.respond({
                        body: denyFile.getFileContent()
                    });
                } else {
                    req.continue();
                }
            })

            await this.page.goto(targetUrl);


        } catch (error) {
            console.log('start error :', error);
        }


    }

   
}

const flyover = new Flyover();


program.version('0.1.0', '-v', '--version').usage('add --path [file]').command('add').description('添加的文件会自动替换掉远程的同名文件').option('-p,--path', '添加的文件路径,默认当前路径 ')
    .action((file, cmd) => {
        if (fs.existsSync(file)) {
            fs.stat(file, (err, stats) => {
                if (!err) {
                    //如果是目录  第一版本不支持目录添加
                    if (stats.isDirectory()) {}
                    //如果是文件
                    else if (stats.isFile()) {
                        //则拷贝文件到 ctrllist 目录
                        let fileName = path.basename(file);
                        fs.createReadStream(file).pipe(fs.createWriteStream(path.resolve(__dirname, `./ctrllist/${fileName}`)))
                    }
                } else {
                    console.log(err);
                }
            })
        } else {
            console.log('对不起，你添加的路径不存在');
        }

    });

program.command('start').description('启动flyover服务').action((cmd) => {
    flyover.start();
});



program.command('config').description('添加用户配置').option('-u,--url', '设置用户要访问的url').action((url, cmd) => {
    try {
        let urlObj = URL.parse(url);
        //默认加入http
        if(urlObj.protocol){
            flyover.setTargetUrl(urlObj.href);
        }else{
            flyover.setTargetUrl(`http://${urlObj.href}`);
            
        }
    } catch (error) {
        console.log(error);
    }
   
});

program.command('list').description('列出已添加的文件').action(cmd=>{
    let ctrlsfiles = fs.readdirSync(path.resolve(__dirname, './ctrllist'));
    console.log(ctrlsfiles.join('\n'));
});

program.parse(process.argv);