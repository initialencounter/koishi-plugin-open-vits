import { Context, h, Session, Logger, Quester } from 'koishi';
import Vits from '@initencounter/vits';
import { BaseConfigType } from './config';
import { SpeakerList, T4wefanText, VitsEngine } from './types';
export declare const inject: string[];
export declare const name: string;
export declare const logger: Logger;
declare module 'koishi' {
    interface User {
        vits_speakerId: number;
        vits_engine: VitsEngine;
    }
}
declare class OpenVits extends Vits {
    last_messageId: string;
    speaker: number;
    speakers: SpeakerList;
    max_speakers: number;
    speaker_dict: string[];
    recall_time: number;
    max_length: number;
    endpoint: string;
    http: Quester;
    t4wefan_text: T4wefanText;
    baseConfig: BaseConfigType;
    constructor(ctx: Context, config: BaseConfigType);
    handleSwitch(session: Session<'vits_engine' | 'vits_speakerId'>, input: string, engine?: VitsEngine): Promise<string>;
    handleSay(session: Session<'vits_engine' | 'vits_speakerId'>, options: any, input: string): Promise<string | h>;
    /**
     *
     * @param input 要转化的文本
     * @returns
     */
    say(option: OpenVits.Result): Promise<h>;
    /**
     *
     * @param option 要转化的文本
     * @param engine VITS引擎
     * @returns
     */
    baseSay(option: OpenVits.Result, engine: VitsEngine): Promise<h>;
}
declare namespace OpenVits {
    const usage: string;
    interface Result {
        input: string;
        speaker_id?: number;
        output?: h;
    }
    const Config: import("schemastery")<BaseConfigType>;
}
export default OpenVits;
