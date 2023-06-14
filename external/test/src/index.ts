import { Context, Schema } from 'koishi'
import { } from "koishi-plugin-open-vits"
export const name = 'test'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command('test').action(async()=>{
    return await ctx.vits.say({"input":'1231'})
  })
}
