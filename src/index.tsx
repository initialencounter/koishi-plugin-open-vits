import { Context, Schema, h, Session, Logger, Dict, trimSlash } from 'koishi'
import { } from '@koishijs/translator'
import Vits from '@initencounter/vits'
import path, { resolve } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
export const inject = ['translator', 'database']
export const name: string = 'open-vits'
export const logger: Logger = new Logger(name)

declare module 'koishi' {
  interface Tables {
    speakers: Speakers
  }
}

// 这里是新增表的接口类型
export interface Speakers {
  id: number
  channelId: string
  vits_speakerId: number
  bert_vits_speakerId: number
}



// function writeToFile(channelId, data) {
//   const dirPath = path.join(__dirname, 'data')
//   if (!existsSync(dirPath)) {
//     mkdirSync(dirPath)
//   }
//   const filePath = path.join(dirPath, `${channelId}.txt`)
//   writeFileSync(filePath, data)
// }
// function readFromFile(channelId) {
//   const filePath = path.join(__dirname, 'data', `${channelId}.txt`)
//   try {
//     if (existsSync(filePath)) {
//       const data = readFileSync(filePath, 'utf8')
//       return data
//     } else {
//       return `No data found`
//     }
//   } catch (error) {
//     console.error(error)
//     return 'An error occurred while reading the file.'
//   }
// }
function processspeakersData(data) {
  // 确定包含BERT-VITS2数组
  if (!data['BERT-VITS2']) {
    return { formattedString: 'No BERT-VITS2 data found.', maxId: 0 }
  }
  const bertVits2 = data['BERT-VITS2']
  let maxId = -1
  const formattedString = bertVits2.map(item => {
    if (item.id > maxId) {
      maxId = item.id
    }
    return `${item.id}:${item.name}`
  }).join('\n')
  return { formattedString: `Id对照表:\n${formattedString}`, maxId: maxId }
}


class OpenVits extends Vits {
  temp_msg: string
  speaker: number
  speaker_list: Dict[]
  max_speakers: number
  speaker_dict: string[]
  recall_time: number
  max_length: number
  endpoint: string
  constructor(ctx: Context, private config: OpenVits.Config) {
    super(ctx)
    ctx.model.extend('speakers', {
      // 各字段的类型声明
      id: 'unsigned',
      channelId: 'text',
      vits_speakerId: 'integer',
      bert_vits_speakerId: 'integer',
    })
    this.recall_time = config.recall_time
    this.max_length = config.max_length
    this.endpoint = config.endpoint
    this.speaker_dict = []
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.on('ready', async () => {
      this.speaker_list = (await this.ctx.http.get(trimSlash(`${config.endpoint}/voice/speakers`)))['VITS']
      this.max_speakers = this.speaker_list.length - 1
      this.speaker = Number(config.speaker_id)
      this.speaker = ((this.speaker < this.max_speakers) && this.speaker > -1) ? this.speaker : 0
      for (const i of this.speaker_list) {
        this.speaker_dict.push(JSON.stringify(i))
      }
    })
    // 记录发送消息的messageid
    ctx.on('send', (session) => {
      this.temp_msg = session.messageId
    })
    ctx.command('切换语音 <input:text>', '更换语音角色，每个频道独立')
      .action(async ({ session }, input) => {
        try {
          let speaker_get = await ctx.http.get(`${this.endpoint}/voice/speakers`)
          let speaker_id_raw = processspeakersData(speaker_get)
          if (speaker_id_raw.formattedString === 'No BERT-VITS2 data found.') {
            return `切换语音功能暂时只对bert_vits2生效`
          }
          let MAXID = speaker_id_raw.maxId
          let speaker_text = speaker_id_raw.formattedString

          if (isNaN(Number(input)) || Number(input) < 0 || Number(input) > MAXID) {
            return `请输入一个介于0到${MAXID}之间的数字\n${speaker_text}`
          }
          await this.setSpecker(session.channelId, Number(input), 'bert')
          return `已经切换到${input}号角色`
        } catch (error) {
          console.error(error)
          return '在处理请求时发生错误'
        }
      })
    ctx.command('say <input:text>', 'vits语音合成')
      .option('speaker', '-s <speaker:string>', { fallback: config.speaker_id })
      .option('lang', '-l <lang:string>')
      .action(async ({ session, options }, input) => {
        if (config.waiting) {
          if (config.endpoint === 'https://api.vits.t4wefan.pub') {
            await session.send((String(await ctx.http.get('https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt', { responseType: 'text' })) + String(options.lang ? options.lang : 'zh')))
          } else {
            await session.send(session.text('commands.say.message.waiting'))
          }
          // 判断是否需要撤回
          if (config.recall) {
            this.recall(session, this.temp_msg)
          }
        }
        if (!input) {
          if (config.endpoint === 'https://api.vits.t4wefan.pub') {
            return (String(h('at', { id: (session.userId) })) + String(await ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/help.txt', { responseType: 'text' })))
          } else {
            return session.execute('help say')
          }
        }
        if (input.length > config.max_length) {
          if (config.endpoint === 'https://api.vits.t4wefan.pub') {
            return String(h('at', { id: (session.userId) })) + (String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: 'text' })))
          } else {
            return session.text('commands.say.message.too-long')
          }
        }
        // 判断speaker_id是否合法
        const reg: RegExp = /^\d+(\d+)?$/
        if ((!reg.test(options.speaker))) {
          this.speaker = (() => {
            for (const i in this.speaker_dict) {
              const id: number = this.speaker_dict[i].indexOf(options.speaker)
              if (id > -1) {
                return id
              }
            }
            return this.speaker
          })()
        } else {
          this.speaker = options.speaker ? Number(options.speaker) : Number(config.speaker_id)
          this.speaker = ((this.speaker < this.max_speakers) && this.speaker > -1) ? this.speaker : 0
        }
        const languageCodes = ['zh', 'en', 'fr', 'jp', 'ru', 'de']
        if (options.lang) {
          if ((languageCodes.indexOf(options.lang) > -1) && config.translator && ctx.translator) {
            const zhPromptMap: string[] = input.match(/[\u4e00-\u9fa5]+/g)
            if (zhPromptMap?.length > 0) {
              try {
                const translatedMap = (await ctx.translator.translate({ input: zhPromptMap.join(','), target: options.lang })).toLocaleLowerCase().split(',')
                zhPromptMap.forEach((t, i) => {
                  input = input.replace(t, translatedMap[i]).replace('，', ',')
                })
              } catch (err) {
                logger.warn(err)
              }
            }
          }
        }
        if (this.config.bert_vits2) {
          this.speaker = (await this.getSpeaker(session.channelId))?.bert_vits_speakerId ?? 0
        }
        const speaker_id: number = this.speaker
        const result: OpenVits.Result = { input, speaker_id }
        result.output = await this.say(result)
        return result.output
      })
  }
  // 撤回的方法
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.recall_time))
  }

  /**
   * 
   * @param input 要转化的文本
   * @param speaker_id 音色id，可选
   * @returns 
   */
  async say(option: OpenVits.Result): Promise<h> {
    let { input, speaker_id } = option
    if (!speaker_id) {
      speaker_id = this.speaker
    }
    if (input.length > this.max_length) {
      return h(String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: 'text' })))
    }
    try {
      let url = ``
      if (this.config.bert_vits2) {
        url = trimSlash(`${this.endpoint}/voice/bert-vits2?text=${encodeURIComponent(input)}&id=${speaker_id}&format=${this.config.format}&lang=${this.config.lang == 'jp' ? "ja" : this.config.lang}&length=${this.config.speech_length} `);
      } else {
        url = trimSlash(`${this.endpoint}/voice?text=${encodeURIComponent(input)}&id=${speaker_id}&format=${this.config.format}&lang=${this.config.lang == 'jp' ? "ja" : this.config.lang}&length=${this.config.speech_length} `);
      }
      const response: Buffer = await this.ctx.http.get(url, { responseType: 'arraybuffer' })
      return h.audio(response, 'audio/mpeg')
    } catch (e) {
      logger.info(String(e))
      return h(String(e))
    }

  }
  async getSpeaker(channelId: string) {
    const data = (await this.ctx.database.get('speakers', { channelId: channelId }, ['vits_speakerId', 'bert_vits_speakerId']))[0]
    return data
  }
  async setSpecker(channelId: string, speakerId: number, type: string) {
    const data = await this.getSpeaker(channelId)
    if (data) {
      const idMap = {
        vits_speakerId: type === "bert" ? speakerId : data.vits_speakerId,
        bert_vits_speakerId: type === "bert" ? data.bert_vits_speakerId : speakerId
      }
      return await this.ctx.database.set('speakers', { channelId: channelId }, idMap)
    }
    const idMap = {
      vits_speakerId: type === "bert" ? speakerId : this.config.speaker_id,
      bert_vits_speakerId: type === "bert" ? this.config.speaker_id : speakerId
    }
    return await this.ctx.database.set('speakers', { channelId: channelId }, idMap)
  }

}
namespace OpenVits {
  export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString("utf-8").split("更新日志")[0]}`
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
  export interface Config {
    endpoint: string
    max_length: number
    waiting: boolean
    recall: boolean
    recall_time: number
    speaker_id: number
    bert_vits2: boolean
    translator: boolean
    format: 'ogg' | 'wav' | 'amr' | 'mp3'
    lang: 'mix' | 'zh' | 'en' | 'jp' | 'auto'
    speech_length: number
  }
  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      endpoint: Schema.string().default('https://api.vits.t4wefan.pub').description('vits服务器地址'),
      bert_vits2: Schema.boolean().default(false).description('是否是bert_vits2模型'),
      max_length: Schema.number().default(256).description('最大长度'),
      translator: Schema.boolean().default(true).description('将启用翻译'),
    }).description("基础设置"),
    Schema.object({
      speaker_id: Schema.number().default(0).description('speaker_id'),
      format: Schema.union([
        Schema.const('ogg'),
        Schema.const('wav'),
        Schema.const('amr'),
        Schema.const('mp3')])
        .default('ogg').description('音频格式'),
      lang: Schema.union([
        Schema.const('mix'),
        Schema.const('zh'),
        Schema.const('en'),
        Schema.const('jp'),
        Schema.const('auto')
      ]).default('mix').description('语言'),
      speech_length: Schema.number().role('slider').min(0).max(2).step(0.1).default(1.4).description('语速, 越大越慢'),
    }).description("参数设置"),
    Schema.object({
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      recall: Schema.boolean().default(true).description('会撤回思考中'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
    }).description("拓展设置")
  ])


}

export default OpenVits