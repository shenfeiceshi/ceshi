const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证token并获取用户ID（可选）
async function getUserIdFromToken(token) {
  if (!token) {
    return null // 允许无token访问，返回默认任务
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // 检查token是否过期（24小时）
    const now = Date.now()
    const tokenAge = now - payload.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    if (tokenAge > maxAge) {
      return null // token过期，返回默认任务
    }
    
    return payload.userId
  } catch (error) {
    return null // token无效，返回默认任务
  }
}

// 生成默认任务数据
function getDefaultTasks() {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      _id: 'default_1',
      id: 1,
      title: '早起打卡',
      category: '生活习惯',
      points: 10,
      time: '07:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_2',
      id: 2,
      title: '刷牙洗脸',
      category: '个人卫生',
      points: 5,
      time: '07:30',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_3',
      id: 3,
      title: '阅读30分钟',
      category: '学习成长',
      points: 15,
      time: '19:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_4',
      id: 4,
      title: '运动锻炼',
      category: '健康运动',
      points: 20,
      time: '16:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_5',
      id: 5,
      title: '整理房间',
      category: '生活习惯',
      points: 10,
      time: '20:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    }
  ];
}



exports.main = async (event, context) => {
  try {
    const { taskDate = new Date().toISOString().split('T')[0], token } = event
    
    // 验证token并获取用户ID
    const userId = await getUserIdFromToken(token)
    
    let tasks = []
    
    if (userId) {
      // 有有效用户ID，从数据库获取任务
      try {
        const result = await db.collection('tasks').where({
          userId: userId,
          taskDate: taskDate
        }).get()
        
        tasks = result.data || []
      } catch (dbError) {
        console.log('数据库查询失败，使用默认任务:', dbError.message)
        tasks = getDefaultTasks()
      }
    } else {
      // 无有效用户ID，返回默认任务
      tasks = getDefaultTasks()
    }
    
    return {
      success: true,
      data: {
        tasks: tasks
      }
    }
  } catch (error) {
    console.error('Get tasks error:', error)
    
    // 发生任何错误时，返回默认任务
    return {
      success: true,
      data: {
        tasks: getDefaultTasks()
      }
    }
  }
}

// 生成默认任务数据
function getDefaultTasks() {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      _id: 'default_1',
      id: 1,
      title: '早起打卡',
      category: '生活习惯',
      points: 10,
      time: '07:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_2',
      id: 2,
      title: '刷牙洗脸',
      category: '个人卫生',
      points: 5,
      time: '07:30',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_3',
      id: 3,
      title: '阅读30分钟',
      category: '学习成长',
      points: 15,
      time: '19:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_4',
      id: 4,
      title: '运动锻炼',
      category: '健康运动',
      points: 20,
      time: '16:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    },
    {
      _id: 'default_5',
      id: 5,
      title: '整理房间',
      category: '生活习惯',
      points: 10,
      time: '20:00',
      completed: false,
      userId: 'default',
      taskDate: today,
      isCompleted: false
    }
  ];
}