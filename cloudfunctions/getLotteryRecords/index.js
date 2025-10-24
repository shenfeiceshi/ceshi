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
    const { page = 1, pageSize = 20, token } = event
    
    // 如果没有token，返回空数据
    if (!token) {
      return {
        success: true,
        data: {
          records: [],
          hasMore: false
        }
      }
    }
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    const skip = (page - 1) * pageSize
    
    const result = await db.collection('lotteryRecords')
      .where({
        userId: userId
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    // 获取奖品信息
    const records = result.data
    const prizeIds = records.filter(record => record.prizeId).map(record => record.prizeId)
    
    let prizes = []
    if (prizeIds.length > 0) {
      const prizesResult = await db.collection('lotteryPrizes')
        .where({
          _id: db.command.in(prizeIds)
        })
        .get()
      prizes = prizesResult.data
    }
    
    // 合并奖品信息
    const recordsWithPrizes = records.map(record => {
      if (record.prizeId) {
        const prize = prizes.find(p => p._id === record.prizeId)
        return {
          ...record,
          prize: prize || null
        }
      }
      return record
    })
    
    return {
      success: true,
      data: {
        records: recordsWithPrizes,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('Get lottery records error:', error)
    return {
      success: true,
      data: {
        records: [],
        hasMore: false
      }
    }
  }
}