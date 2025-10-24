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
    
    // 开始事务
    const transaction = await db.startTransaction()
    
    try {
      // 更新用户积分
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          points: _.inc(amount),
          updateTime: new Date()
        }
      })
      
      // 添加积分记录
      await transaction.collection('pointRecords').add({
        data: {
          _openid: OPENID,
          amount: amount,
          source: source,
          description: description,
          relatedId: relatedId || null,
          relatedType: relatedType || null
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      // 获取更新后的用户信息
      const userResult = await db.collection('users').where({
        _openid: OPENID
      }).get()
      
      return {
        success: true,
        data: {
          newBalance: userResult.data[0].points
        }
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Add points error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}