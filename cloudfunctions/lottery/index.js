const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const { costPoints = 10 } = event
    
    // 检查用户积分
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const user = userResult.data[0]
    if (user.points < costPoints) {
      throw new Error('积分不足')
    }
    
    // 获取所有可用奖品
    const prizesResult = await db.collection('lotteryPrizes').where({
      isActive: true
    }).get()
    
    if (prizesResult.data.length === 0) {
      throw new Error('暂无可用奖品')
    }
    
    // 抽奖逻辑
    const prizes = prizesResult.data
    const random = Math.random()
    let cumulativeProbability = 0
    let wonPrize = null
    
    for (const prize of prizes) {
      cumulativeProbability += prize.probability
      if (random <= cumulativeProbability) {
        wonPrize = prize
        break
      }
    }
    
    const isWinner = wonPrize !== null
    
    // 开始事务
    const transaction = await db.startTransaction()
    
    try {
      // 扣除积分
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          points: _.inc(-costPoints),
          updateTime: new Date()
        }
      })
      
      // 添加抽奖记录
      await transaction.collection('lotteryRecords').add({
        data: {
          _openid: OPENID,
          prizeId: wonPrize ? wonPrize._id : null,
          costPoints: costPoints,
          isWinner: isWinner
        }
      })
      
      // 添加积分记录
      await transaction.collection('pointRecords').add({
        data: {
          _openid: OPENID,
          amount: -costPoints,
          source: '抽奖消费',
          description: `抽奖消费${costPoints}积分`,
          relatedType: 'lottery'
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          isWinner: isWinner,
          prize: wonPrize,
          newBalance: user.points - costPoints
        }
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Lottery error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}