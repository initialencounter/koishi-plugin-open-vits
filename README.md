# koishi-plugin-open-vits

[![npm](https://img.shields.io/npm/v/koishi-plugin-open-vits?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-open-vits)
<a name="readme-top"></a>
## 部署方法
- 1.先部署[vits后端](https://github.com/Artrajz/vits-simple-api)
- 2.再部署本项目

## 环境依赖

- [vits后端](https://github.com/Artrajz/vits-simple-api)所需环境
- nodejs14以上版本
- Koishi
- go-cqhttp
- ffmpeg

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 使用方法
* 1.启动[vits后端](https://github.com/Artrajz/vits-simple-api)接口

* 2.启动[go-cqhttp](https://github.com/Mrs4s/go-cqhttp)并开启正向ws服务

* 2-1配置onebot
将index.ts中的
```
endpoint: 'ws://127.0.0.1:32333'
```
修改为go-cqhttp的正向ws服务地址

* 3.安装[koishi](https://koishi.chat)依赖

在本项目根目录下运行
```shell
npm i
```

* 4.启动机器人
```
node -r esbuild-register .
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>
<a name="readme-top"></a>
## 注意事项
>对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-open-vits 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
后端搭建教程<a style="color:blue" href="https://github.com/Artrajz/vits-simple-api">vits-simple-api</a>
## 使用方法
- say 要转化的文本
  - 可选项-s 说话的音色id


## 更新日志
* v0.0.4 修复空格bug，新增encodeURIComponent编码
* v0.0.3 添加usage, 作者信息
* v0.0.2 实现了vits服务

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

QQ群399899914



<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [t4wefan](https://github.com/t4wefan)后端及插件贡献者
* [vits-simple-api](https://github.com/Artrajz/vits-simple-api)A simple vits API | MoeGoe API
* [koishi](https://koishi.chat)跨平台、可扩展、高性能的机器人框架

<p align="right">(<a href="#readme-top">back to top</a>)</p>