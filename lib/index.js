"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.name = exports.using = void 0;
const koishi_1 = require("koishi");
const vits_1 = __importDefault(require("@initencounter/vits"));
const fs = require('fs');
const path = require('path');
exports.using = ['translator'];
exports.name = 'open-vits';
exports.logger = new koishi_1.Logger(exports.name);
function writeToFile(channelId, data) {
    const dirPath = path.join(__dirname, 'data');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    const filePath = path.join(dirPath, `${channelId}.txt`);
    fs.writeFileSync(filePath, data);
}
function readFromFile(channelId) {
    const filePath = path.join(__dirname, 'data', `${channelId}.txt`);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return data;
        } else {
            return `No data found`;
        }
    } catch (error) {
        console.error(error);
        return 'An error occurred while reading the file.';
    }
}
function processspeakersData(data) {
    // 确定包含BERT-VITS2数组
    if (!data["BERT-VITS2"]) {
        return "No BERT-VITS2 data found.";
    }
    const bertVits2 = data["BERT-VITS2"];
    let maxId = -1;
    const formattedString = bertVits2.map(item => {
        if (item.id > maxId) {
            maxId = item.id;
        }
        return `${item.id}:${item.name}`;
    }).join('\n');
    return { formattedString: `Id对照表:\n${formattedString}`, maxId: maxId };
}

class OpenVits extends vits_1.default {
    constructor(ctx, config) {
        super(ctx);
        this.config = config;
        this.recall_time = config.recall_time;
        this.max_length = config.max_length;
        this.endpoint = config.endpoint;
        this.speaker_dict = [];
        ctx.i18n.define('zh', require('./locales/zh'));
        ctx.on('ready', async () => {
            this.speaker_list = (await this.ctx.http.get((0, koishi_1.trimSlash)(`${config.endpoint}/voice/speakers`)))['VITS'];
            this.max_speakers = this.speaker_list.length - 1;
            this.speaker = Number(config.speaker_id);
            this.speaker = ((this.speaker < this.max_speakers) && this.speaker > -1) ? this.speaker : 0;
            for (const i of this.speaker_list) {
                this.speaker_dict.push(JSON.stringify(i));
            }
        });
        // 记录发送消息的messageid
        ctx.on('send', (session) => {
            this.temp_msg = session.messageId;
        });
        ctx.command('切换语音 <input:text>', '更换语音角色，每个频道独立')
            .action(async ({ session }, input) => {
                try {
                    let speaker_get = await ctx.http.get(`${this.endpoint}/voice/speakers`);
                    let speaker_id_raw = processspeakersData(speaker_get);
                    if (speaker_id_raw === "No BERT-VITS2 data found.") {
                        return `切换语音功能暂时只对bert_vits2生效`
                    }
                    let MAXID = speaker_id_raw.maxId;
                    let speaker_text = speaker_id_raw.formattedString;

                    if (isNaN(input) || input < 0 || input > MAXID) {
                        return `请输入一个介于0到${MAXID}之间的数字\n${speaker_text}`;
                    }
                    writeToFile(session.channelId, input);
                    return `已经切换到${input}号角色`;
                } catch (error) {
                    console.error(error);
                    return '在处理请求时发生错误';
                }
            });

        ctx.command('say <input:text>', 'vits语音合成')
            .option('lang', '-l <lang:string>')
            .action(async ({ session, options }, input) => {
            if (config.waiting) {
                if (config.endpoint === "https://api.vits.t4wefan.pub") {
                    await session.send((String(await ctx.http.get('https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt', { responseType: "text" })) + String(options.lang ? options.lang : 'zh')));
                }
                else {
                    await session.send(session.text("commands.say.message.waiting"));
                }
                // 判断是否需要撤回
                if (config.recall) {
                    this.recall(session, this.temp_msg);
                }
            }
            if (!input) {
                if (config.endpoint === "https://api.vits.t4wefan.pub") {
                    return (String((0, koishi_1.h)('at', { id: (session.userId) })) + String(await ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/help.txt', { responseType: "text" })));
                }
                else {
                    return session.execute("help say");
                }
            }
            if (input.length > config.max_length) {
                if (config.endpoint === "https://api.vits.t4wefan.pub") {
                    return String((0, koishi_1.h)('at', { id: (session.userId) })) + (String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
                }
                else {
                    return session.text("commands.say.message.too-long");
                }
            }
            // 判断speaker_id是否合法
            const reg = /^\d+(\d+)?$/;
            if ((!reg.test(options.speaker))) {
                this.speaker = (() => {
                    for (const i in this.speaker_dict) {
                        const id = this.speaker_dict[i].indexOf(options.speaker);
                        if (id > -1) {
                            return id;
                        }
                    }
                    return this.speaker;
                })();
            }
            else {
                this.speaker = options.speaker ? Number(options.speaker) : Number(config.speaker_id);
                this.speaker = ((this.speaker < this.max_speakers) && this.speaker > -1) ? this.speaker : 0;
            }
            const languageCodes = ['zh', 'en', 'fr', 'jp', 'ru', 'de'];
            if (options.lang) {
                if ((languageCodes.indexOf(options.lang) > -1) && config.translator && ctx.translator) {
                    const zhPromptMap = input.match(/[\u4e00-\u9fa5]+/g);
                    if (zhPromptMap?.length > 0) {
                        try {
                            const translatedMap = (await ctx.translator.translate({ input: zhPromptMap.join(','), target: options.lang })).toLocaleLowerCase().split(',');
                            zhPromptMap.forEach((t, i) => {
                                input = input.replace(t, translatedMap[i]).replace('，', ',');
                            });
                        }
                        catch (err) {
                            exports.logger.warn(err);
                        }
                    }
                }
            }
            const speaker_id = this.speaker;
            const result = { input, speaker_id };
            result.output = await this.say(result, session);
            return result.output;
        });
    }
    // 撤回的方法
    async recall(session, messageId) {
        new Promise(resolve => setTimeout(() => {
            session.bot.deleteMessage(session.channelId, messageId);
        }, this.recall_time));
    }
    /**
     *
     * @param input 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns
     */
    async say(option, session) {
        let { input, speaker_id } = option;
        if (!speaker_id) {
            speaker_id = this.speaker;
        }
        if (input.length > this.max_length) {
            return (0, koishi_1.h)(String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
        }
        try {
            let CID = readFromFile(session.channelId);
            if (CID === `No data found`) {
                writeToFile(session.channelId, `0`);
                CID = `0`
            }
            let url = ``
            if (this.config.bert_vits2) {
                url = (0, koishi_1.trimSlash)(`${this.endpoint}/voice/bert-vits2?text=${encodeURIComponent(input)}&id=${CID}&format=${this.config.format}&lang=${this.config.lang == 'jp' ? "ja" : this.config.lang}&length=${this.config.speech_length} `);
            } else {
                url = (0, koishi_1.trimSlash)(`${this.endpoint}/voice?text=${encodeURIComponent(input)}&id=${CID}&format=${this.config.format}&lang=${this.config.lang == 'jp' ? "ja" : this.config.lang}&length=${this.config.speech_length} `);
            }
            const response = await this.ctx.http.get(url, { responseType: 'arraybuffer' });
            return koishi_1.h.audio(response, 'audio/mpeg');
        }
        catch (e) {
            exports.logger.info(String(e));
            return (0, koishi_1.h)(String(e));
        }
    }
    ;
}
(function (OpenVits) {
    OpenVits.usage = `
## 注意事项
>对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-open-vits 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
后端搭建教程<a style="color:blue" href="https://github.com/Artrajz/vits-simple-api">vits-simple-api</a>
## 使用方法
* say 要转化的文本

## 问题反馈群: 
099899914
`;
    OpenVits.Config = koishi_1.Schema.object({
        endpoint: koishi_1.Schema.string().default('https://api.vits.t4wefan.pub').description('vits服务器地址'),
        bert_vits2: koishi_1.Schema.boolean().default(false).description('是否是bert_vits2模型'),
        max_length: koishi_1.Schema.number().default(256).description('最大长度'),
        waiting: koishi_1.Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
        recall: koishi_1.Schema.boolean().default(true).description('会撤回思考中'),
        recall_time: koishi_1.Schema.number().default(5000).description('撤回的时间'),
        translator: koishi_1.Schema.boolean().default(true).description('将启用翻译'),
        format: koishi_1.Schema.union([
            koishi_1.Schema.const("ogg"),
            koishi_1.Schema.const("wav"),
            koishi_1.Schema.const("amr"),
            koishi_1.Schema.const("mp3")
        ])
            .default('ogg').description("音频格式"),
        lang: koishi_1.Schema.union([
            koishi_1.Schema.const("mix"),
            koishi_1.Schema.const("zh"),
            koishi_1.Schema.const("en"),
            koishi_1.Schema.const("jp"),
            koishi_1.Schema.const("auto")
        ])
            .default('mix').description("语言"),
        speech_length: koishi_1.Schema.number().default(1.4).description('speech lenght'),
    });
})(OpenVits || (OpenVits = {}));
exports.default = OpenVits;
