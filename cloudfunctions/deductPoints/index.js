const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const { amount, source, description, relatedId, relatedType } = event
    
    // 检查用户积分是否足够
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const currentPoints = userResult.data[0].points
    if (currentPoints < amount) {
      throw new Error('积分不足')
    }
    
    // 开始事务
    const transaction = await db.startTransaction()
    
    try {
      // 扣除用户积分
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          points: _.inc(-amount),
          updateTime: new Date()
        }
      })
      
      // 添加积分记录
      await transaction.collection('pointRecords').add({
        data: {
          _openid: OPENID,
          amount: -amount,
          source: source,
          description: description,
          relatedId: relatedId || null,
          relatedType: relatedType || null
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          newBalance: currentPoints - amount
        }
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Deduct points error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}