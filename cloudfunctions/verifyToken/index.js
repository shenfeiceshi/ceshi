const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证token
function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // 检查token是否过期（24小时）
    const now = Date.now()
    const tokenAge = now - payload.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    if (tokenAge > maxAge) {
      return { valid: false, error: 'Token已过期' }
    }
    
    return { valid: true, userId: payload.userId }
  } catch (error) {
    return { valid: false, error: 'Token格式错误' }
  }
}

exports.main = async (event, context) => {
  const { token } = event
  
  try {
    if (!token) {
      return {
        success: false,
        error: 'Token不能为空'
      }
    }
    
    // 验证token格式和有效性
    const tokenResult = verifyToken(token)
    if (!tokenResult.valid) {
      return {
        success: false,
        error: tokenResult.error
      }
    }
    
    // 查找用户
    const userResult = await db.collection('users').where({
      userId: tokenResult.userId
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user
    
    return {
      success: true,
      data: {
        userInfo: userInfo,
        token: token
      }
    }
  } catch (error) {
    console.error('Verify token error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}