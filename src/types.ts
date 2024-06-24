export interface VITSOptions {
    text: string; // 需要合成语音的文本
    id?: number; // 说话人id
    format?: string; // 音频格式，支持wav,ogg,silk,mp3,flac
    lang?: string; // 文本语言，auto为自动识别语言模式，lang=mix时，文本应该用[ZH] 或 [JA] 包裹
    length?: number; // 语音长度/语速，调节语音长度，相当于调节语速，该数值越大语速越慢
    noise?: number; // 样本噪声，控制合成的随机性
    noisew?: number; // 随机时长预测器噪声，控制音素发音长度
    segment_size?: number; // 分段阈值，按标点符号分段，加起来大于segment_size时为一段文本，segment_size<=0表示不分段
    streaming?: boolean; // 流式合成语音，更快的首包响应
}

export interface BertVITS2Options extends VITSOptions {
    sdp_ratio?: number; // SDP/DP混合比，SDP在合成时的占比，理论上此比率越高，合成的语音语调方差越大
    emotion?: number; // 情感控制，Bert-VITS2 v2.1可用，范围为0-9
    reference_audio?: any; // 情感参考音频，Bert-VITS2 v2.1 使用参考音频来控制合成音频的情感
    text_prompt?: string; // 文本提示词，Bert-VITS2 v2.2 文本提示词，用于控制情感
    style_text?: string; // 文本提示词，Bert-VITS2 v2.3 文本提示词，用于控制情感
    style_weight?: number; // 文本提示词权重，Bert-VITS2 v2.3 文本提示词，用于提示词权重
}

export type Lang = 'zh'|'en'|'fr'|'jp'|'ru'|'de'|'sh'
export type Speaker = {
    id: number,
    lang: Lang[],
    name: string
}

export type VitsEngine = "BERT-VITS2" | "GPT-SOVITS" | "HUBERT-VITS" | "VITS" | "W2V2-VITS"
export type SpeakerList = {
    [key in VitsEngine]: Speaker[];
}

export type T4wefanText = {
    help: string,
    waiting: string
    'too-long': string
}