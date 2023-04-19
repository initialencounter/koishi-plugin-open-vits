import { Context } from 'koishi'
import console from '@koishijs/plugin-console'
import * as sandbox from '@koishijs/plugin-sandbox'
import onebot from '@koishijs/plugin-adapter-onebot'
import open_vits from 'koishi-plugin-open-vits'
// 创建一个 Koishi 应用
const ctx = new Context({
  port: 5140,
})
// 使用 OneBot 适配器的机器人
ctx.plugin(onebot, {
    protocol: 'ws',
    selfId: '3111720341',
    endpoint: 'ws://127.0.0.1:32333',
  })

// 启用上述插件
ctx.plugin(console)     // 提供控制台
ctx.plugin(sandbox)     // 提供调试沙盒
// 启用glm-bot
ctx.plugin(open_vits,{
    endpoint: 'https://api.vits.t4wefan.pub',
    speaker_id: 3,
    max_length: 1024,
    waiting: true,
    waiting_text: '思考中...',
    recall: true,
    recall_time: 5000,
    max_speakers: 3
})

// 启动应用
ctx.start()