// 获取积分统计云函数
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
    const { type, token } = event
    
    // 如果没有token，返回默认数据
    if (!token) {
      return {
        success: true,
        data: {
          points: 0,
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            totalDiaries: 0,
            continuousDays: 0
          }
        }
      }
    }
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)

    if (type === 'stats') {
      // 获取用户信息和积分
      const userResult = await db.collection('users').where({
        userId: userId
      }).get()
      
      if (userResult.data.length === 0) {
        return {
          success: true,
          data: {
            points: 0,
            stats: {
              totalTasks: 0,
              completedTasks: 0,
              totalDiaries: 0,
              continuousDays: 0
            }
          }
        }
      }
      
      const user = userResult.data[0]
      
      // 获取任务统计
      const tasksResult = await db.collection('tasks').where({
        userId: userId
      }).get()
      
      const totalTasks = tasksResult.data.length
      const completedTasks = tasksResult.data.filter(task => task.isCompleted).length
      
      // 获取日记统计
      const diariesResult = await db.collection('diaries').where({
        userId: userId
      }).get()
      
      const totalDiaries = diariesResult.data.length
      
      // 计算连续天数（简化版本）
      const continuousDays = 0 // 这里可以实现更复杂的连续天数计算逻辑
      
      return {
        success: true,
        data: {
          points: user.points || 0,
          stats: {
            totalTasks,
            completedTasks,
            totalDiaries,
            continuousDays
          }
        }
      }
    }
    
    return {
      success: false,
      error: '不支持的类型'
    }
  } catch (error) {
    console.error('获取积分统计失败:', error)
    return {
      success: true,
      data: {
        points: 0,
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          totalDiaries: 0,
          continuousDays: 0
        }
      }
    }
  }
}