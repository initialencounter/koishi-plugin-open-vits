import { Schema } from "koishi";
export interface BaseConfigType {
    endpoint: string;
    max_length: number;
    waiting: boolean;
    recall: boolean;
    recall_time: number;
    speaker_id: number;
    defaultEngine: 'BERT-VITS2' | 'GPT-SOVITS' | 'HUBERT-VITS' | 'VITS' | 'W2V2-VITS';
    reference_audio: string;
    text_prompt: string;
    prompt_text: string;
    prompt_lang: string;
    defaultSpeaker: number;
    translator: boolean;
    format: 'ogg' | 'wav' | 'amr' | 'mp3';
    lang: 'zh' | 'en' | 'jp' | 'auto';
    speech_length: number;
}
export declare const BaseConfig: Schema<BaseConfigType>;
