import { Context, Schema, h, Session, Logger, Dict } from 'koishi';
import Vits from '@initencounter/vits';
export declare const inject: string[];
export declare const name: string;
export declare const logger: Logger;
declare module 'koishi' {
    interface Tables {
        speakers: Speakers;
    }
}
export interface Speakers {
    id: number;
    channelId: string;
    vits_speakerId: number;
    bert_vits_speakerId: number;
}
declare class OpenVits extends Vits {
    temp_msg: string;
    speaker: number;
    speaker_list: Dict[];
    max_speakers: number;
    speaker_dict: string[];
    recall_time: number;
    max_length: number;
    endpoint: string;
    constructor(ctx: Context, config: OpenVits.Config);
    recall(session: Session, messageId: string): Promise<void>;
    /**
     *
     * @param input 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns
     */
    say(option: OpenVits.Result): Promise<h>;
    getSpeaker(channelId: string): Promise<Pick<Speakers, "vits_speakerId" | "bert_vits_speakerId">>;
    setSpecker(channelId: string, speakerId: number, type: string): Promise<import("minato").Driver.WriteResult>;
}
declare namespace OpenVits {
    const usage: string;
    interface Result {
        input: string;
        speaker_id?: number;
        output?: h;
    }
    interface Config {
        endpoint: string;
        max_length: number;
        waiting: boolean;
        recall: boolean;
        recall_time: number;
        speaker_id: number;
        bert_vits2: boolean;
        translator: boolean;
        format: 'ogg' | 'wav' | 'amr' | 'mp3';
        lang: 'mix' | 'zh' | 'en' | 'jp' | 'auto';
        speech_length: number;
    }
    const Config: Schema<Config>;
}
export default OpenVits;
