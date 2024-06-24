# :sparkles: koishi-plugin-open-vits :sparkles:

[![npm](https://img.shields.io/npm/v/koishi-plugin-open-vits?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-open-vits)

## :warning: 注意事项

对于部署者行为及所产生的任何纠纷，Koishi及koishi-plugin-open-vits概不负责。
如果有更多文本内容想要修改，可以在[本地化]("/locales")中修改zh内容。
后端搭建教程 [vits-simple-api](https://github.com/Artrajz/vits-simple-api)

## :rocket: 使用方法

- say 要转化的文本
  - 可选项-s 说话的音色id

## :memo: 更新日志

* v2.0.0 
  重构代码
  适配 `BERT-VITS2` | `GPT-SOVITS` | `HUBERT-VITS` | `VITS` | `W2V2-VITS`
* v1.6.2 修改语言 jp 为 ja (close #5)
* v1.6.0 新增 lang format length 参数 (close #4)
* v1.5.6 更改本地化文本 (close #3)
* v1.4.1 更改speaker选项缩写
* v1.4.0 重写服务vits
* v1.3.0 重写服务vits
* v1.2.0 新增翻译服务
* v1.0.2 修复无法启用的bug
* v0.0.4 修复空格bug，新增 encodeURIComponent 编码
* v0.0.3 添加usage, 作者信息
* v0.0.2 实现了vits服务

## Contact

QQ群399899914

## Acknowledgments

* [t4wefan](https://github.com/t4wefan) 后端及插件贡献者
* [vits-simple-api](https://github.com/Artrajz/vits-simple-api) vits 本地部署API
* [koishi](https://koishi.chat) 跨平台、可扩展、高性能的机器人框架