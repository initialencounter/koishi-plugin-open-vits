import { Context, h, Session, Logger, Quester } from 'koishi'
import { } from '@koishijs/translator'
import Vits from '@initencounter/vits'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { BaseConfigType, BaseConfig } from './config'
import { AudioMime, GPTSOVITSOptions, Lang, Speaker, SpeakerList, T4wefanText, VitsEngine } from './types'
import { optionsToFormData, getSpeakerList, getT4wefanText, recall, translateText, getMimeTypeFromFilename } from './utils'
export const inject = ['translator', 'database']
export const name: string = 'open-vits'
export const logger: Logger = new Logger(name)

const ENGINE_MAP = {
  'BERT-VITS2': '/bert-vits2',
  'GPT-SOVITS': '/gpt-sovits',
  'HUBERT-VITS': '/hubert-vits',
  'VITS': '/vits',
  'W2V2-VITS': '/w2v2-vits'
}

declare module 'koishi' {
  interface User {
    vits_speakerId: number
    vits_engine: VitsEngine
  }
}

function processSpeakersData(data: Speaker[]) {
  let maxId = -1
  const formattedString = data.map(item => {
    if (item.id > maxId) {
      maxId = item.id
    }
    return `${item.id}:${item.name}`
  }).join('\n')
  return { formattedString: `Id对照表:\n${formattedString}`, maxId: maxId }
}


class OpenVits extends Vits {
  last_messageId: string
  speaker: number
  speakers: SpeakerList
  max_speakers: number
  speaker_dict: string[]
  recall_time: number
  max_length: number
  endpoint: string
  http: Quester
  t4wefan_text: T4wefanText
  baseConfig: BaseConfigType
  reference_audio: Buffer
  reference_audio_mime: AudioMime
  constructor(ctx: Context, config: BaseConfigType) {
    super(ctx)
    this.baseConfig = config
    ctx.model.extend('user', {
      vits_speakerId: 'integer',
      vits_engine: 'string',
    })
    this.http = ctx.http.extend({
      baseURL: config.endpoint
    })
    this.recall_time = config.recall_time
    this.max_length = config.max_length
    this.endpoint = config.endpoint
    this.speaker_dict = []

    // 初始化插件
    ctx.on('ready', async () => {
      this.speakers = await getSpeakerList(this.http)

      // 如果默认引擎不存在 speaker, 则自动切换引擎
      // 如果没有 speaker, 则抛出错误
      if (this.speakers[config.defaultEngine].length === 0) {
        for (let [engine, speakerList] of Object.entries(this.speakers)) {
          if (speakerList.length > 0) {
            config.defaultEngine = engine as VitsEngine
            break
          }
        }
        if (this.speakers[config.defaultEngine].length === 0) {
          throw new Error('No speaker available')
        }
      }

      // 如果默认引擎不存在默认 speaker, 则自动切换 speaker 为 0
      if (this.speaker > this.speakers[config.defaultEngine].length) {
        this.speaker = 0
      }

      // 如果API来自于t4wefan, 则获取 t4wefan 的云端文本
      if (config.endpoint === 'https://api.vits.t4wefan.pub') {
        this.t4wefan_text = await getT4wefanText(ctx.http)
      }

      this.reference_audio = readFileSync(config.reference_audio)
      getMimeTypeFromFilename(config.reference_audio)
      ctx.i18n.define('zh', require('./locales/zh'))
    })

    // 记录发送消息的 messageid
    ctx.on('send', (session) => {
      this.last_messageId = session.messageId
    })
    ctx.command('切换语音 <input:text>', '更换语音角色，每个用户独立', { checkArgCount: true })
      .action(async ({ session }, input) => this.handleSwitch(session as Session<'vits_engine' | 'vits_speakerId'>, input))
    ctx.command('say <input:text>', 'vits语音合成')
      .option('speaker', '-s <speaker:string>', { fallback: config.speaker_id })
      .option('lang', '-l <lang:string>')
      .action(async ({ session, options }, input) => this.handleSay(session as Session<'vits_engine' | 'vits_speakerId'>, options, input))
  }


  async handleSwitch(session: Session<'vits_engine' | 'vits_speakerId'>, input: string, engine?: VitsEngine) {
    let userEngine = session.user.vits_engine
    if (!userEngine) {
      userEngine = this.baseConfig.defaultEngine
    }
    if (!engine) {
      engine = userEngine
    }
    try {
      const speaker_id_raw = processSpeakersData(this.speakers[engine])
      let MAXID = speaker_id_raw.maxId
      let speaker_text = speaker_id_raw.formattedString

      if (isNaN(Number(input)) || Number(input) < 0 || Number(input) > MAXID) {
        return `请输入一个介于0到${MAXID}之间的数字\n${speaker_text}`
      }
      // setSpeaker
      session.user.vits_speakerId = Number(input)
      return `已经切换到${input}号角色`
    } catch (error) {
      logger.error(error)
      return '在处理请求时发生错误'
    }
  }
  async handleSay(session: Session<'vits_engine' | 'vits_speakerId'>, options, input: string) {
    if (this.baseConfig.waiting) {
      await session.send(this.t4wefan_text
        ? this.t4wefan_text.waiting
        : session.text('commands.say.message.waiting'))
      recall(this.baseConfig.recall, this.baseConfig.recall_time, session, this.last_messageId)
    }

    if (!input) {
      return this.t4wefan_text ? this.t4wefan_text.help : session.execute('help say')
    }

    if (input.length > this.baseConfig.max_length) {
      return this.t4wefan_text ? this.t4wefan_text['too-long'] : session.text('commands.say.message.too-long')
    }

    const languageCodes: Lang[] = ['zh', 'en', 'fr', 'jp', 'ru', 'de']
    if (options.lang && languageCodes.includes(options.lang) && this.baseConfig.translator && this.ctx.translator) {
      input = await translateText(this.ctx.translator, input, logger, options.lang) ?? input
    }

    if (!session.user.vits_speakerId) {
      session.user.vits_speakerId = this.baseConfig.defaultSpeaker
    }

    const speaker_id: number = (options.speaker ?? session.user.vits_speakerId) ?? this.baseConfig.defaultSpeaker
    const engine: VitsEngine = session.user.vits_engine ?? this.baseConfig.defaultEngine
    const result: OpenVits.Result = { input, speaker_id }
    return await this.baseSay(result, engine)
  }
  /**
   * 
   * @param input 要转化的文本
   * @returns 
   */
  async say(option: OpenVits.Result): Promise<h> {
    return await this.baseSay(option, this.baseConfig.defaultEngine)
  }

  /**
   * 
   * @param option 要转化的文本
   * @param engine VITS引擎
   * @returns 
   */
  async baseSay(option: OpenVits.Result, engine: VitsEngine): Promise<h> {
    let { input, speaker_id } = option
    if (speaker_id === undefined) {
      throw ('speaker_id is required')
    }
    if (input.length > this.max_length) {
      return this.t4wefan_text
        ? h(this.t4wefan_text['too-long'])
        : h.i18n('commands.say.message.too-long')
    }
    try {
      let options: GPTSOVITSOptions = {
        text: input,
        id: speaker_id,
        format: this.baseConfig.format,
        lang: this.baseConfig.lang == 'jp' ? "ja" : this.baseConfig.lang,
        length: this.baseConfig.speech_length,
        text_prompt: this.baseConfig.text_prompt,
        prompt_text: this.baseConfig.prompt_text,
        prompt_lang: this.baseConfig.prompt_lang,
        reference_audio: new Blob([this.reference_audio], { type: this.reference_audio_mime }),
      }

      let formData: FormData = optionsToFormData(options)
      let url = `/voice${ENGINE_MAP[engine]}`
      const response = await this.http.post(url, formData, { responseType: 'arraybuffer' })
      return h.audio(response, 'audio/mpeg')

    } catch (e) {
      logger.info(e)
      return h(e)
    }
  }

}
namespace OpenVits {
  export const usage = `${readFileSync(resolve(__dirname, '../README.md')).toString("utf-8").split("更新日志")[0]}`
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
  export const Config = BaseConfig
}
export default OpenVits