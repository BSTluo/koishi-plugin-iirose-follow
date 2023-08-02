import { Context, Schema, Logger } from 'koishi'
import { } from 'koishi-plugin-adapter-iirose'

export const name = 'iirose-follow'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

const logger = new Logger('IIROSE-Follow')

declare module 'koishi' {
  interface Tables {
    iirose_follow: follow
  }
}

export interface follow {
  uid: string
  status: boolean
}

export function apply(ctx: Context) {
  ctx.model.extend('iirose_follow', {
    uid: 'string',
    status: 'boolean'
  }, {
    primary: 'uid'
  })

  ctx.command('跟随').action(async v => {
    if (v.session.platform !== 'IIROSE_Bot') { return ' [IIROSE-Follow] 该平台不支持使用此插件' }
    const userData = await ctx.database.get('iirose_follow', v.session.author.userId)

    if (userData.length > 0 && userData[0].status) {
      return ' [IIROSE-Follow] 你已经设置为跟随状态了哦~'
    } else if (userData.length > 0) {
      await ctx.database.set('iirose_follow', v.session.author.userId, {
        uid: v.session.author.userId,
        status: true
      })

      return ` [IIROSE-Follow] 将 [*${v.session.author.username}*] 设置为BOT跟随状态`
    } else if (userData.length == 0) {
      ctx.database.create('iirose_follow', {
        uid: v.session.author.userId,
        status: true
      })

      return ` [IIROSE-Follow] 将 [*${v.session.author.username}*] 设置为BOT跟随状态`
    }
  })

  ctx.command('取消跟随').action(async v => {
    if (v.session.platform !== 'IIROSE_Bot') { return ' [IIROSE-Follow] 该平台不支持使用此插件' }
    const userData = await ctx.database.get('iirose_follow', v.session.author.userId)

    if (userData.length > 0 && !userData[0].status) {
      return ` [IIROSE-Follow]  [*${v.session.author.username}*] 你本就没有要求BOT跟随`
    } else if (userData.length > 0) {
      await ctx.database.set('iirose_follow', v.session.author.userId, {
        uid: v.session.author.userId,
        status: false
      })

      return ` [IIROSE-Follow] 将 [*${v.session.author.username}*] 设置为BOT跟随状态`
    } else if (userData.length == 0) {
      ctx.database.create('iirose_follow', {
        uid: v.session.author.userId,
        status: false
      })

      return ` [IIROSE-Follow] 将 [*${v.session.author.username}*] 设置为BOT跟随状态`
    }

  })

  ctx.on('iirose/switchRoom', async (session, data) => {
    const userData = await ctx.database.get('iirose_follow', data.uid)

    if (userData.length <= 0 || !userData[0].status) {
      return session.send({
        private: {
          message: ' [IIROSE-Follow] 你并没有将BOT设置为跟随状态',
          userId: data.uid
        }
      })
    }

    const newRoomId = data.targetRoom
    if (session.guildId === newRoomId) {
      return session.send({
        private: {
          message: ' [IIROSE-Follow] 跳转失败，目标房间与当前机器人所在房间可能位置相同',
          userId: data.uid
        }
      })
    }

    ctx.emit('iirose/moveRoom', { roomId: data.targetRoom })
    logger.info(`跳转到房间ID为:[ ${data.targetRoom} ]的房间`)
  })

}
