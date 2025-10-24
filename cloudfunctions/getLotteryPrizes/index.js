const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 如果没有奖品集合，返回默认奖品数据
    const result = await db.collection('lotteryPrizes').where({
      isActive: true
    }).get()
    
    if (result.data.length === 0) {
      // 返回默认奖品数据
      return {
        success: true,
        data: {
          prizes: [
            {
              _id: 'default_1',
              name: '小红花',
              emoji: '🌺',
              probability: 30,
              description: '获得一朵小红花奖励！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_2',
              name: '积分奖励',
              emoji: '💰',
              probability: 25,
              description: '获得10积分奖励！',
              points: 10,
              isActive: true
            },
            {
              _id: 'default_3',
              name: '星星奖励',
              emoji: '⭐',
              probability: 20,
              description: '获得一颗星星奖励！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_4',
              name: '再接再厉',
              emoji: '💪',
              probability: 15,
              description: '继续努力，下次一定有好运！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_5',
              name: '幸运大奖',
              emoji: '🎁',
              probability: 10,
              description: '恭喜获得幸运大奖！',
              points: 50,
              isActive: true
            }
          ]
        }
      }
    }
    
    return {
      success: true,
      data: {
        prizes: result.data
      }
    }
  } catch (error) {
    console.error('Get lottery prizes error:', error)
    // 如果集合不存在，也返回默认数据
    if (error.code === -502005) {
      return {
        success: true,
        data: {
          prizes: [
            {
              _id: 'default_1',
              name: '小红花',
              emoji: '🌺',
              probability: 30,
              description: '获得一朵小红花奖励！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_2',
              name: '积分奖励',
              emoji: '💰',
              probability: 25,
              description: '获得10积分奖励！',
              points: 10,
              isActive: true
            },
            {
              _id: 'default_3',
              name: '星星奖励',
              emoji: '⭐',
              probability: 20,
              description: '获得一颗星星奖励！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_4',
              name: '再接再厉',
              emoji: '💪',
              probability: 15,
              description: '继续努力，下次一定有好运！',
              points: 0,
              isActive: true
            },
            {
              _id: 'default_5',
              name: '幸运大奖',
              emoji: '🎁',
              probability: 10,
              description: '恭喜获得幸运大奖！',
              points: 50,
              isActive: true
            }
          ]
        }
      }
    }
    return {
      success: false,
      error: error.message
    }
  }
}