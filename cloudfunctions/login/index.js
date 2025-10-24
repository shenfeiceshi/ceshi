const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成JWT token
function generateToken(userId) {
  const payload = {
    userId: userId,
    timestamp: Date.now()
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// 密码加密
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

exports.main = async (event, context) => {
  const { username, password } = event
  
  try {
    // 验证输入参数
    if (!username || !password) {
      return {
        success: false,
        error: '用户名和密码不能为空'
      }
    }
    
    // 查找用户
    const userResult = await db.collection('users').where({
      username: username
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户名不存在'
      }
    }
    
    const user = userResult.data[0]
    const hashedPassword = hashPassword(password)
    
    // 验证密码
    if (user.password !== hashedPassword) {
      return {
        success: false,
        error: '密码错误'
      }
    }
    
    // 生成登录token
    const token = generateToken(user.userId)
    
    // 更新最后登录时间
    await db.collection('users').doc(user._id).update({
      data: {
        lastLoginTime: new Date()
      }
    })
    
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
    console.error('Login error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}