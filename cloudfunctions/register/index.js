const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 密码加密
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 生成用户ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

exports.main = async (event, context) => {
  const { username, password, nickname } = event
  
  try {
    // 验证输入参数
    if (!username || !password) {
      return {
        success: false,
        error: '用户名和密码不能为空'
      }
    }
    
    // 验证用户名格式（只允许字母、数字、下划线，长度3-20）
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return {
        success: false,
        error: '用户名只能包含字母、数字、下划线，长度3-20位'
      }
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return {
        success: false,
        error: '密码长度不能少于6位'
      }
    }
    
    // 检查用户名是否已存在
    const existingUser = await db.collection('users').where({
      username: username
    }).get()
    
    if (existingUser.data.length > 0) {
      return {
        success: false,
        error: '用户名已存在'
      }
    }
    
    // 创建新用户
    const hashedPassword = hashPassword(password)
    const userId = generateUserId()
    
    const createResult = await db.collection('users').add({
      data: {
        userId: userId,
        username: username,
        password: hashedPassword,
        nickname: nickname || username,
        avatarUrl: '',
        points: 0,
        totalDiaries: 0,
        continuousDays: 0,
        lastDiaryDate: null,
        createTime: new Date(),
        lastLoginTime: new Date()
      }
    })
    
    // 返回用户信息（不包含密码）
    const userInfo = {
      _id: createResult._id,
      userId: userId,
      username: username,
      nickname: nickname || username,
      avatarUrl: '',
      points: 0,
      totalDiaries: 0,
      continuousDays: 0,
      lastDiaryDate: null,
      createTime: new Date(),
      lastLoginTime: new Date()
    }
    
    return {
      success: true,
      data: {
        userInfo: userInfo,
        message: '注册成功'
      }
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}