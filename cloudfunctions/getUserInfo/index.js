// 获取用户信息云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证token并获取用户ID
async function getUserIdFromToken(token) {
  if (!token) {
    throw new Error('Token不能为空')
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // 检查token是否过期（24小时）
    const now = Date.now()
    const tokenAge = now - payload.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    if (tokenAge > maxAge) {
      throw new Error('Token已过期')
    }
    
    return payload.userId
  } catch (error) {
    throw new Error('Token无效')
  }
}

exports.main = async (event, context) => {
  try {
    const { token } = event
    
    // 如果没有token，返回默认用户信息
    if (!token) {
      return {
        success: true,
        data: {
          userInfo: {
            userId: '',
            openid: '',
            nickname: '小六',
            avatar: '/images/default-avatar.png',
            points: 0,
            level: 'Lv.1',
            createTime: new Date(),
            lastLoginTime: new Date()
          }
        }
      }
    }
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)

    // 查询用户信息
    const userResult = await db.collection('users').where({
      userId: userId
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: true,
        data: {
          userInfo: {
            userId: '',
            openid: '',
            nickname: '小六',
            avatar: '/images/default-avatar.png',
            points: 0,
            level: 'Lv.1',
            createTime: new Date(),
            lastLoginTime: new Date()
          }
        }
      }
    }

    const userInfo = userResult.data[0]
    
    return {
      success: true,
      data: {
        userInfo: {
          userId: userInfo.userId,
          openid: userInfo.openid,
          nickname: userInfo.nickname || userInfo.nickName || '小六',
          avatar: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
          points: userInfo.points || 0,
          level: userInfo.level || 'Lv.1',
          createTime: userInfo.createTime,
          lastLoginTime: userInfo.lastLoginTime
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: true,
      data: {
        userInfo: {
          userId: '',
          openid: '',
          nickname: '小六',
          avatar: '/images/default-avatar.png',
          points: 0,
          level: 'Lv.1',
          createTime: new Date(),
          lastLoginTime: new Date()
        }
      }
    }
  }
}