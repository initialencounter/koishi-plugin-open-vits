var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/locales/zh.yml
var require_zh = __commonJS({
  "src/locales/zh.yml"(exports, module2) {
    module2.exports = { commands: { say: { description: "vits语音合成", usage: '-| <> <message forward> <message id=1> 项目地址https://github.com/Artrajz/vits-simple-api </message> <message id=2> 插件仓库https://github.com/initialencounter/koishi-plugin-open-vits </message> <message id=3> 指令如下：</message> <message id=4>1.[文字转语音] 请发送 "say 文本"</message> </message> </>', message: { "too-long": "文本消息过长", waiting: "计算中..." } } } };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default,
  inject: () => inject,
  logger: () => logger,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi2 = require("koishi");
var import_vits = __toESM(require("@initencounter/vits"));
var import_path = require("path");
var import_fs = require("fs");

// src/config.ts
var import_koishi = require("koishi");
var BaseConfig = import_koishi.Schema.intersect([
  import_koishi.Schema.object({
    endpoint: import_koishi.Schema.string().default("https://api.vits.t4wefan.pub").description("vits服务器地址"),
    defaultEngine: import_koishi.Schema.union(
      [
        "BERT-VITS2",
        "GPT-SOVITS",
        "HUBERT-VITS",
        "VITS",
        "W2V2-VITS"
      ]
    ).default("VITS").description("默认引擎"),
    defaultSpeaker: import_koishi.Schema.number().default(0).description("默认说话人"),
    max_length: import_koishi.Schema.number().default(256).description("最大长度"),
    translator: import_koishi.Schema.boolean().default(true).description("将启用翻译")
  }).description("基础设置"),
  import_koishi.Schema.object({
    speaker_id: import_koishi.Schema.number().default(0).description("speaker_id"),
    format: import_koishi.Schema.union([
      import_koishi.Schema.const("ogg"),
      import_koishi.Schema.const("wav"),
      import_koishi.Schema.const("amr"),
      import_koishi.Schema.const("mp3")
    ]).default("ogg").description("音频格式"),
    lang: import_koishi.Schema.union([
      import_koishi.Schema.const("zh"),
      import_koishi.Schema.const("en"),
      import_koishi.Schema.const("jp"),
      import_koishi.Schema.const("auto")
    ]).default("zh").description("语言"),
    speech_length: import_koishi.Schema.number().role("slider").min(0).max(2).step(0.1).default(1.4).description("语速, 越大越慢")
  }).description("参数设置"),
  import_koishi.Schema.object({
    waiting: import_koishi.Schema.boolean().default(true).description("消息反馈，会发送思考中..."),
    recall: import_koishi.Schema.boolean().default(true).description("会撤回思考中"),
    recall_time: import_koishi.Schema.number().default(5e3).description("撤回的时间")
  }).description("拓展设置")
]);

// src/utils.ts
async function getSpeakerList(http) {
  let speakers = await http.get("/voice/speakers");
  return speakers;
}
__name(getSpeakerList, "getSpeakerList");
async function recall(recall2, recall_time, session, messageId) {
  if (!recall2) {
    return;
  }
  new Promise((resolve2) => setTimeout(() => {
    session.bot.deleteMessage(session.channelId, messageId);
  }, recall_time));
}
__name(recall, "recall");
function OptionsToQuery(obj) {
  const params = new URLSearchParams();
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      params.append(key, obj[key]);
    }
  }
  return params.toString();
}
__name(OptionsToQuery, "OptionsToQuery");
async function getT4wefanText(http) {
  const urls = [
    "https://drive.t4wefan.pub/d/koishi/vits/help.txt",
    "https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt",
    "https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt"
  ];
  const responses = await Promise.all(urls.map((url) => http.get(url, { responseType: "text" })));
  return {
    help: responses[0],
    waiting: responses[1],
    "too-long": responses[2]
  };
}
__name(getT4wefanText, "getT4wefanText");
async function translateText(translator, input, logger2, lang) {
  const zhPromptMap = input.match(/[\u4e00-\u9fa5]+/g);
  if (zhPromptMap?.length === 0) {
    return "";
  }
  try {
    const translatedMap = (await translator.translate({ input: zhPromptMap.join(","), target: lang })).toLocaleLowerCase().split(",");
    zhPromptMap.forEach((t, i) => {
      input = input.replace(t, translatedMap[i]).replace("，", ",");
    });
  } catch (err) {
    logger2.warn(err);
  }
}
__name(translateText, "translateText");

// src/index.ts
var inject = ["translator", "database"];
var name = "open-vits";
var logger = new import_koishi2.Logger(name);
var ENGINE_MAP = {
  "BERT-VITS2": "/bert-vits2",
  "GPT-SOVITS": "/gpt-sovits",
  "HUBERT-VITS": "/hubert-vits",
  "VITS": "/vits",
  "W2V2-VITS": "/w2v2-vits"
};
function processSpeakersData(data) {
  let maxId = -1;
  const formattedString = data.map((item) => {
    if (item.id > maxId) {
      maxId = item.id;
    }
    return `${item.id}:${item.name}`;
  }).join("\n");
  return { formattedString: `Id对照表:
${formattedString}`, maxId };
}
__name(processSpeakersData, "processSpeakersData");
var OpenVits = class extends import_vits.default {
  static {
    __name(this, "OpenVits");
  }
  last_messageId;
  speaker;
  speakers;
  max_speakers;
  speaker_dict;
  recall_time;
  max_length;
  endpoint;
  http;
  t4wefan_text;
  baseConfig;
  constructor(ctx, config) {
    super(ctx);
    this.baseConfig = config;
    ctx.model.extend("user", {
      vits_speakerId: "integer",
      vits_engine: "string"
    });
    this.http = ctx.http.extend({
      baseURL: config.endpoint
    });
    this.recall_time = config.recall_time;
    this.max_length = config.max_length;
    this.endpoint = config.endpoint;
    this.speaker_dict = [];
    ctx.on("ready", async () => {
      this.speakers = await getSpeakerList(this.http);
      if (this.speakers[config.defaultEngine].length === 0) {
        for (let [engine, speakerList] of Object.entries(this.speakers)) {
          if (speakerList.length > 0) {
            config.defaultEngine = engine;
            break;
          }
        }
        if (this.speakers[config.defaultEngine].length === 0) {
          throw new Error("No speaker available");
        }
      }
      if (this.speaker > this.speakers[config.defaultEngine].length) {
        this.speaker = 0;
      }
      if (config.endpoint === "https://api.vits.t4wefan.pub") {
        this.t4wefan_text = await getT4wefanText(ctx.http);
      }
      ctx.i18n.define("zh", require_zh());
    });
    ctx.on("send", (session) => {
      this.last_messageId = session.messageId;
    });
    ctx.command("切换语音 <input:text>", "更换语音角色，每个用户独立").action(async ({ session }, input) => this.handleSwitch(session, input));
    ctx.command("say <input:text>", "vits语音合成").option("speaker", "-s <speaker:string>", { fallback: config.speaker_id }).option("lang", "-l <lang:string>").action(async ({ session, options }, input) => this.handleSay(session, options, input));
  }
  async handleSwitch(session, input, engine) {
    let userEngine = session.user.vits_engine;
    if (!userEngine) {
      userEngine = this.baseConfig.defaultEngine;
    }
    if (!engine) {
      engine = userEngine;
    }
    try {
      const speaker_id_raw = processSpeakersData(this.speakers[engine]);
      let MAXID = speaker_id_raw.maxId;
      let speaker_text = speaker_id_raw.formattedString;
      if (isNaN(Number(input)) || Number(input) < 0 || Number(input) > MAXID) {
        return `请输入一个介于0到${MAXID}之间的数字
${speaker_text}`;
      }
      session.user.vits_speakerId = Number(input);
      return `已经切换到${input}号角色`;
    } catch (error) {
      logger.error(error);
      return "在处理请求时发生错误";
    }
  }
  async handleSay(session, options, input) {
    if (this.baseConfig.waiting) {
      await session.send(this.t4wefan_text ? this.t4wefan_text.waiting : session.text("commands.say.message.waiting"));
      recall(this.baseConfig.recall, this.baseConfig.recall_time, session, this.last_messageId);
    }
    if (!input) {
      return this.t4wefan_text ? this.t4wefan_text.help : session.execute("help say");
    }
    if (input.length > this.baseConfig.max_length) {
      return this.t4wefan_text ? this.t4wefan_text["too-long"] : session.text("commands.say.message.too-long");
    }
    const languageCodes = ["zh", "en", "fr", "jp", "ru", "de"];
    if (options.lang && languageCodes.includes(options.lang) && this.baseConfig.translator && this.ctx.translator) {
      input = await translateText(this.ctx.translator, input, logger, options.lang) ?? input;
    }
    if (!session.user.vits_speakerId) {
      session.user.vits_speakerId = this.baseConfig.defaultSpeaker;
    }
    const speaker_id = options.speaker ?? session.user.vits_speakerId ?? this.baseConfig.defaultSpeaker;
    const engine = session.user.vits_engine ?? this.baseConfig.defaultEngine;
    const result = { input, speaker_id };
    return await this.baseSay(result, engine);
  }
  /**
   * 
   * @param input 要转化的文本
   * @returns 
   */
  async say(option) {
    return await this.baseSay(option, this.baseConfig.defaultEngine);
  }
  /**
   * 
   * @param option 要转化的文本
   * @param engine VITS引擎
   * @returns 
   */
  async baseSay(option, engine) {
    let { input, speaker_id } = option;
    if (speaker_id === void 0) {
      throw "speaker_id is required";
    }
    if (input.length > this.max_length) {
      return this.t4wefan_text ? (0, import_koishi2.h)(this.t4wefan_text["too-long"]) : import_koishi2.h.i18n("commands.say.message.too-long");
    }
    try {
      let options = {
        text: input,
        id: speaker_id,
        format: this.baseConfig.format,
        lang: this.baseConfig.lang == "jp" ? "ja" : this.baseConfig.lang,
        length: this.baseConfig.speech_length
      };
      let urlQuery = OptionsToQuery(options);
      let url = `/voice${ENGINE_MAP[engine]}?${urlQuery}`;
      const response = await this.http.get(url, { responseType: "arraybuffer" });
      return import_koishi2.h.audio(response, "audio/mpeg");
    } catch (e) {
      logger.info(String(e));
      return (0, import_koishi2.h)(String(e));
    }
  }
};
((OpenVits2) => {
  OpenVits2.usage = `${(0, import_fs.readFileSync)((0, import_path.resolve)(__dirname, "../readme.md")).toString("utf-8").split("更新日志")[0]}`;
  OpenVits2.Config = BaseConfig;
})(OpenVits || (OpenVits = {}));
var src_default = OpenVits;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  inject,
  logger,
  name
});
