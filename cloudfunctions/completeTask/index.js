const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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
    const { taskId, token } = event
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    // 获取任务信息
    const taskResult = await db.collection('tasks').doc(taskId).get()
    if (!taskResult.data) {
      throw new Error('任务不存在')
    }
    
    const task = taskResult.data
    if (task.isCompleted) {
      throw new Error('任务已完成')
    }
    
    // 验证任务属于当前用户
    if (task.userId !== userId) {
      throw new Error('无权限操作此任务')
    }
    
    // 开始事务
    const transaction = await db.startTransaction()
    
    try {
      // 标记任务完成
      await transaction.collection('tasks').doc(taskId).update({
        data: {
          isCompleted: true,
          completedAt: new Date(),
          updateTime: new Date()
        }
      })
      
      // 增加用户积分
      await transaction.collection('users').where({
        userId: userId
      }).update({
        data: {
          points: _.inc(task.pointsReward),
          updateTime: new Date()
        }
      })
      
      // 添加积分记录
      await transaction.collection('pointRecords').add({
        data: {
          userId: userId,
          amount: task.pointsReward,
          source: '完成任务',
          description: `完成任务"${task.title}"获得${task.pointsReward}积分`,
          relatedId: taskId,
          relatedType: 'task'
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          pointsEarned: task.pointsReward
        }
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('Complete task error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}