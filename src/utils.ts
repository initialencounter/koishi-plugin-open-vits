import { Logger, Quester, Session } from 'koishi'
import { BertVITS2Options, GPTSOVITSOptions, SpeakerList } from './types'
import Translator from '@koishijs/translator'
import FormData from 'form-data'

export async function getSpeakerList(http: Quester) {
    let speakers = await http.get('/voice/speakers')
    return speakers
}
// 撤回的方法
export async function recall(recall: boolean, recall_time: number, session: Session, messageId: string) {
    if (!recall) {
        return
    }
    new Promise(resolve => setTimeout(() => {
        session.bot.deleteMessage(session.channelId, messageId)
    }, recall_time))
}


export function optionsToQuery(obj: BertVITS2Options): string {
    const params = new URLSearchParams()
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            params.append(key, obj[key])
        }
    }
    return params.toString()
}

export function optionsToFormData(obj: GPTSOVITSOptions): FormData {
    const formData = new FormData()
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            formData.append(key, obj[key])
        }
    }
    return formData
}

export async function getT4wefanText(http: Quester) {
    const urls = [
        'https://drive.t4wefan.pub/d/koishi/vits/help.txt',
        'https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt',
        'https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt'
    ]

    const responses = await Promise.all(urls.map(url => http.get(url, { responseType: 'text' })))

    return {
        help: responses[0],
        waiting: responses[1],
        'too-long': responses[2]
    }
}

export async function translateText(
    translator: Translator<Translator.Config>,
    input: string,
    logger: Logger,
    lang: string) {
    const zhPromptMap: string[] = input.match(/[\u4e00-\u9fa5]+/g)
    if (zhPromptMap?.length === 0) {
        return ''
    }
    try {
        const translatedMap = (await translator.translate({ input: zhPromptMap.join(','), target: lang })).toLocaleLowerCase().split(',')
        zhPromptMap.forEach((t, i) => {
            input = input.replace(t, translatedMap[i]).replace('，', ',')
        })
    } catch (err) {
        logger.warn(err)
    }
}