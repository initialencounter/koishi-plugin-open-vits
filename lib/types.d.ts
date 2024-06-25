export interface VITSOptions {
    text: string;
    id?: number;
    format?: string;
    lang?: string;
    length?: number;
    noise?: number;
    noisew?: number;
    segment_size?: number;
    streaming?: boolean;
}
export interface BertVITS2Options extends VITSOptions {
    sdp_ratio?: number;
    emotion?: number;
    reference_audio?: any;
    text_prompt?: string;
    style_text?: string;
    style_weight?: number;
}
export interface GPTSOVITSOptions extends BertVITS2Options {
    prompt_text?: string;
    prompt_lang?: string;
}
export type Lang = 'zh' | 'en' | 'fr' | 'jp' | 'ru' | 'de' | 'sh';
export type Speaker = {
    id: number;
    lang: Lang[];
    name: string;
};
export type VitsEngine = "BERT-VITS2" | "GPT-SOVITS" | "HUBERT-VITS" | "VITS" | "W2V2-VITS";
export type SpeakerList = {
    [key in VitsEngine]: Speaker[];
};
export type T4wefanText = {
    help: string;
    waiting: string;
    'too-long': string;
};
export type AudioMime = 'audio/mpeg' | 'audio/wav' | 'audio/ogg' | 'audio/aac' | 'audio/flac';
