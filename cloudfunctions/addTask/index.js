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
    const { title, description, category, pointsReward, taskDate, token } = event
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    const result = await db.collection('tasks').add({
      data: {
        userId: userId,
        title: title,
        description: description || '',
        category: category || 'daily',
        pointsReward: pointsReward || 10,
        isSystem: false,
        isCompleted: false,
        completedAt: null,
        taskDate: taskDate
      }
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Add task error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}