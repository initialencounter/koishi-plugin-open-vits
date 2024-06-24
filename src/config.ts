import { Schema } from "koishi"

export interface BaseConfigType {
    endpoint: string
    max_length: number
    waiting: boolean
    recall: boolean
    recall_time: number
    speaker_id: number
    defaultEngine: 'BERT-VITS2' | 'GPT-SOVITS' | 'HUBERT-VITS' | 'VITS' | 'W2V2-VITS'
    defaultSpeaker: number
    translator: boolean
    format: 'ogg' | 'wav' | 'amr' | 'mp3'
    lang: 'zh' | 'en' | 'jp' | 'auto'
    speech_length: number
  }
  export const BaseConfig: Schema<BaseConfigType> = Schema.intersect([
    Schema.object({
      endpoint: Schema.string().default('https://api.vits.t4wefan.pub').description('vits服务器地址'),
      defaultEngine: Schema.union(
        [
          'BERT-VITS2',
          'GPT-SOVITS',
          'HUBERT-VITS',
          'VITS',
          'W2V2-VITS',
        ]
      ).default('VITS').description('默认引擎'),
      defaultSpeaker: Schema.number().default(0).description('默认说话人'),
      max_length: Schema.number().default(256).description('最大长度'),
      translator: Schema.boolean().default(true).description('将启用翻译'),
    }).description("基础设置"),
    Schema.object({
      speaker_id: Schema.number().default(0).description('speaker_id'),
      format: Schema.union([
        Schema.const('ogg'),
        Schema.const('wav'),
        Schema.const('amr'),
        Schema.const('mp3'),])
        .default('ogg').description('音频格式'),
      lang: Schema.union([
        Schema.const('zh'),
        Schema.const('en'),
        Schema.const('jp'),
        Schema.const('auto'),
      ]).default('zh').description('语言'),
      speech_length: Schema.number().role('slider').min(0).max(2).step(0.1).default(1.4).description('语速, 越大越慢'),
    }).description("参数设置"),
    Schema.object({
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      recall: Schema.boolean().default(true).description('会撤回思考中'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
    }).description("拓展设置"),
  ])