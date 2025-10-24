const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const { diaryContent, mood, weather } = event
    
    if (!diaryContent) {
      throw new Error('日记内容不能为空')
    }
    
    // 简单的AI评论生成逻辑（实际项目中可以接入真实的AI服务）
    const comments = [
      '今天的日记写得很棒！继续保持这种积极的心态。',
      '从你的文字中能感受到满满的正能量，加油！',
      '生活中的小美好都被你记录下来了，真是用心的人。',
      '每一天都在成长，为你的坚持点赞！',
      '文字间透露着你对生活的热爱，很感动。',
      '今天又是充实的一天，继续努力哦！',
      '你的观察力很敏锐，能发现生活中的细节。',
      '保持这种记录生活的好习惯，未来的你会感谢现在的自己。'
    ]
    
    // 根据心情和天气调整评论
    let selectedComments = [...comments]
    
    if (mood === 'happy') {
      selectedComments.push('看得出来你今天心情很好，快乐是会传染的！')
      selectedComments.push('开心的日子值得好好记录，愿你每天都这么快乐。')
    } else if (mood === 'sad') {
      selectedComments.push('虽然今天有些不开心，但明天会更好的。')
      selectedComments.push('每个人都会有低落的时候，给自己一个拥抱吧。')
    } else if (mood === 'excited') {
      selectedComments.push('你的兴奋之情溢于言表，真为你感到高兴！')
      selectedComments.push('激动的心情让文字都充满了活力。')
    }
    
    if (weather === 'sunny') {
      selectedComments.push('阳光明媚的日子，心情也跟着明朗起来。')
    } else if (weather === 'rainy') {
      selectedComments.push('雨天也有雨天的美好，静下心来感受生活。')
    }
    
    // 随机选择一个评论
    const randomIndex = Math.floor(Math.random() * selectedComments.length)
    const aiComment = selectedComments[randomIndex]
    
    // 可以在这里添加更复杂的AI逻辑，比如：
    // 1. 调用外部AI API（如OpenAI、百度AI等）
    // 2. 根据日记内容的关键词生成更个性化的评论
    // 3. 分析情感倾向生成相应的建议
    
    return {
      success: true,
      data: {
        comment: aiComment,
        timestamp: new Date()
      }
    }
  } catch (error) {
    console.error('Generate AI comment error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}