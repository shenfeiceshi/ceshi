const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const { nickname, avatarUrl } = event
    
    const result = await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        nickname: nickname,
        avatarUrl: avatarUrl,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}