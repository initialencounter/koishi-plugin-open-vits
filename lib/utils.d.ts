import { Logger, Quester, Session } from 'koishi';
import { BertVITS2Options } from './types';
import Translator from '@koishijs/translator';
export declare function getSpeakerList(http: Quester): Promise<any>;
export declare function recall(recall: boolean, recall_time: number, session: Session, messageId: string): Promise<void>;
export declare function OptionsToQuery(obj: BertVITS2Options): string;
export declare function getT4wefanText(http: Quester): Promise<{
    help: string;
    waiting: string;
    'too-long': string;
}>;
export declare function translateText(translator: Translator<Translator.Config>, input: string, logger: Logger, lang: string): Promise<string>;
