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
    const { diaryDate, content, mood, weather, images, tags, isDraft, token } = event
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    // 检查是否已存在该日期的日记
    const existingDiary = await db.collection('diaries').where({
      userId: userId,
      diaryDate: diaryDate
    }).get()
    
    let result
    if (existingDiary.data.length > 0) {
      // 更新现有日记
      result = await db.collection('diaries').doc(existingDiary.data[0]._id).update({
        data: {
          content: content,
          mood: mood,
          weather: weather,
          images: images || [],
          tags: tags || [],
          isDraft: isDraft || false,
          updateTime: new Date()
        }
      })
    } else {
      // 创建新日记
      result = await db.collection('diaries').add({
        data: {
          userId: userId,
          diaryDate: diaryDate,
          content: content,
          mood: mood,
          weather: weather,
          images: images || [],
          tags: tags || [],
          isDraft: isDraft || false
        }
      })
      
      // 如果不是草稿，更新用户统计信息
      if (!isDraft) {
        await db.collection('users').where({
          userId: userId
        }).update({
          data: {
            totalDiaries: _.inc(1),
            lastDiaryDate: diaryDate,
            updateTime: new Date()
          }
        })
      }
    }
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Save diary error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}