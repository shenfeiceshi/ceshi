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
    const { page = 1, pageSize = 10, startDate, endDate, token, type } = event
    
    // 如果没有token，返回空数据
    if (!token) {
      if (type === 'stats') {
        return {
          success: true,
          data: {
            totalDiaries: 0,
            thisMonthDiaries: 0,
            continuousDays: 0
          }
        }
      }
      return {
        success: true,
        data: {
          diaries: [],
          hasMore: false
        }
      }
    }
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    if (type === 'stats') {
      // 获取统计数据
      const totalResult = await db.collection('diaries').where({
        userId: userId,
        isDraft: false
      }).count()
      
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthResult = await db.collection('diaries').where({
        userId: userId,
        isDraft: false,
        diaryDate: db.command.gte(startOfMonth)
      }).count()
      
      return {
        success: true,
        data: {
          totalDiaries: totalResult.total || 0,
          thisMonthDiaries: monthResult.total || 0,
          continuousDays: 0 // 简化处理
        }
      }
    }
    
    let query = db.collection('diaries').where({
      userId: userId,
      isDraft: false
    })
    
    // 日期范围筛选
    if (startDate && endDate) {
      query = query.where({
        diaryDate: db.command.gte(startDate).and(db.command.lte(endDate))
      })
    }
    
    const result = await query
      .orderBy('diaryDate', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: {
        diaries: result.data,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('Get diaries error:', error)
    if (type === 'stats') {
      return {
        success: true,
        data: {
          totalDiaries: 0,
          thisMonthDiaries: 0,
          continuousDays: 0
        }
      }
    }
    return {
      success: true,
      data: {
        diaries: [],
        hasMore: false
      }
    }
  }
}