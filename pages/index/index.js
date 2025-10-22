// pages/index/index.js
Page({
  data: {
    userInfo: {
      nickName: '小明',
      id: '12345678',
      points: 0,
      avatarUrl: '/images/default-avatar.png'
    },
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    taskProgress: {
      completed: 0,
      total: 0
    },
    quickTasks: [],
    moods: [
      { value: 'happy', emoji: '😊', label: '开心' },
      { value: 'excited', emoji: '😆', label: '兴奋' },
      { value: 'calm', emoji: '😌', label: '平静' },
      { value: 'sad', emoji: '😢', label: '难过' },
      { value: 'angry', emoji: '😠', label: '生气' }
    ],
    currentMood: 'happy',
    aiQuote: {
      text: '每一天都是新的开始，加油小朋友！',
      author: 'AI小助手'
    }
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadUserData();
    this.loadTodayTasks();
    this.loadAIQuote();
  },

  onShow() {
    this.checkLoginStatus();
    this.loadUserData();
    this.loadTodayTasks();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      // 已登录状态
      this.setData({
        hasUserInfo: true,
        userInfo: {
          nickName: userInfo.nickname || userInfo.nickName || '用户',
          avatarUrl: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
          points: userInfo.points || 0,
          id: userInfo.id || userInfo.userId || ''
        }
      });
    } else {
      // 未登录状态
      this.setData({
        hasUserInfo: false,
        userInfo: {
          nickName: '未登录',
          avatarUrl: '/images/default-avatar.png',
          points: 0,
          id: ''
        }
      });
    }
  },

  getUserInfo() {
    if (wx.canIUse('getUserProfile')) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 尝试获取已保存的用户信息
    const savedUserInfo = wx.getStorageSync('userInfo');
    if (savedUserInfo && savedUserInfo.nickname) {
      this.setData({
        userInfo: {
          nickName: savedUserInfo.nickname,
          avatarUrl: savedUserInfo.avatar || '/images/default-avatar.png',
          points: wx.getStorageSync('userPoints') || 0,
          id: savedUserInfo.id || '12345678'
        },
        hasUserInfo: true
      });
    }
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = {
          ...res.userInfo,
          points: wx.getStorageSync('points') || 0
        };
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        this.saveUserInfo(userInfo);
      }
    });
  },

  saveUserInfo(userInfo) {
    wx.setStorageSync('userInfo', userInfo);
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    // 检查是否为新用户
    const diaries = wx.getStorageSync('diaries') || [];
    const userTasks = wx.getStorageSync('userTasks') || [];
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 判断是否为新用户（没有任何历史数据）
    const isNewUser = diaries.length === 0 && 
                     userTasks.length === 0 && 
                     pointsRecords.length === 0 && 
                     currentPoints === 0;
    
    // 新用户显示0积分，老用户显示实际积分
    const points = isNewUser ? 0 : currentPoints;
    
    // 加载今日心情记录
    const todayKey = this.getTodayKey();
    const moodRecordKey = `mood_${todayKey}`;
    const moodRecord = wx.getStorageSync(moodRecordKey);
    const currentMood = moodRecord ? moodRecord.mood : (wx.getStorageSync('todayMood') || '');
    
    // 确保用户信息中的积分与存储中的积分保持同步
    const updatedUserInfo = {
      nickName: userInfo.nickname || userInfo.nickName || '小朋友',
      avatarUrl: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
      points: points, // 使用统一的积分值
      id: userInfo.id || userInfo.userId || '12345678'
    };
    
    // 同步更新用户信息中的积分
    if (userInfo.points !== points) {
      userInfo.points = points;
      wx.setStorageSync('userInfo', userInfo);
    }
    
    this.setData({
      userInfo: updatedUserInfo,
      hasUserInfo: !!(userInfo.nickname || userInfo.nickName),
      currentMood
    });
  },

  loadTodayTasks() {
    // 从本地存储加载任务（与任务列表页面保持一致）
    const tasks = wx.getStorageSync('userTasks') || this.getDefaultTasks();
    const todayKey = this.getTodayKey();
    const todayTaskStatus = wx.getStorageSync(`tasks_${todayKey}`) || {};

    // 更新任务完成状态
    const updatedTasks = tasks.map(task => ({
      ...task,
      completed: todayTaskStatus[task.id] || false
    }));

    // 筛选出未完成的任务，最多显示4个
    const incompleteTasks = updatedTasks.filter(task => !task.completed);
    const quickTasks = incompleteTasks.slice(0, 4);
    
    // 计算完成的任务数量
    const completedTasks = updatedTasks.filter(task => task.completed);
    
    this.setData({
      quickTasks,
      taskProgress: {
        completed: completedTasks.length,
        total: updatedTasks.length
      }
    });
    
    this.drawProgressCircle();
  },

  // 获取默认任务列表（与任务列表页面保持一致）
  getDefaultTasks() {
    return [
      { id: 1, title: '早起打卡', category: '生活习惯', points: 10, time: '07:00', completed: false },
      { id: 2, title: '刷牙洗脸', category: '个人卫生', points: 5, time: '07:30', completed: false },
      { id: 3, title: '阅读30分钟', category: '学习成长', points: 15, time: '19:00', completed: false },
      { id: 4, title: '运动锻炼', category: '健康运动', points: 20, time: '16:00', completed: false },
      { id: 5, title: '整理房间', category: '生活习惯', points: 10, time: '20:00', completed: false }
    ];
  },

  loadAIQuote() {
    const quotes = [
      { text: '每一天都是新的开始，加油小朋友！', author: 'AI小助手' },
      { text: '坚持就是胜利，你是最棒的！', author: 'AI小助手' },
      { text: '今天的努力是明天的收获！', author: 'AI小助手' },
      { text: '相信自己，你可以做到任何事情！', author: 'AI小助手' },
      { text: '成长的路上，每一步都很重要！', author: 'AI小助手' },
      { text: '勇敢面对挑战，你会变得更强大！', author: 'AI小助手' },
      { text: '每个小进步都值得庆祝！', author: 'AI小助手' }
    ];
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    this.setData({
      aiQuote: quotes[randomIndex]
    });
  },

  drawProgressCircle() {
    // 首页按 Figma 为线性进度条，此方法留空以避免绘制圆环
  },

  onQuickCheckin(e) {
    const taskId = parseInt(e.currentTarget.dataset.id);
    
    // 从存储中读取任务数据（与任务列表页面保持一致）
    const tasks = wx.getStorageSync('userTasks') || this.getDefaultTasks();
    const todayKey = this.getTodayKey();
    const todayTaskStatus = wx.getStorageSync(`tasks_${todayKey}`) || {};
    
    // 更新任务完成状态
    const updatedTasks = tasks.map(task => ({
      ...task,
      completed: todayTaskStatus[task.id] || false
    }));
    
    // 切换指定任务的完成状态
    const updatedTasksWithToggle = updatedTasks.map(task => {
      if (task.id === taskId) {
        task.completed = !task.completed;
      }
      return task;
    });

    // 保存任务状态到本地存储
    const newTodayTaskStatus = {};
    updatedTasksWithToggle.forEach(task => {
      newTodayTaskStatus[task.id] = task.completed;
    });
    wx.setStorageSync(`tasks_${todayKey}`, newTodayTaskStatus);

    // 找到被操作的任务
    const task = updatedTasksWithToggle.find(t => t.id === taskId);
    
    // 如果是完成任务，给予积分奖励
    if (task && task.completed) {
      this.addPoints(task.points || 10);
      wx.showToast({
        title: `完成${task.title}，获得${task.points || 10}积分！`,
        icon: 'success'
      });
    }
    
    // 重新加载任务显示（自动替补功能）
    this.loadTodayTasks();
  },

  onSelectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    const todayKey = this.getTodayKey();
    const moodRecordKey = `mood_${todayKey}`;
    const existingMoodRecord = wx.getStorageSync(moodRecordKey);
    
    this.setData({ currentMood: mood });
    
    // 如果今天还没有记录过心情，给予积分奖励
    if (!existingMoodRecord) {
      wx.setStorageSync(moodRecordKey, {
        mood: mood,
        timestamp: new Date().getTime(),
        rewarded: true
      });
      
      this.addPoints(5);
      wx.showToast({
        title: '心情记录成功，获得5积分！',
        icon: 'success'
      });
    } else {
      // 更新心情但不给积分
      wx.setStorageSync(moodRecordKey, {
        ...existingMoodRecord,
        mood: mood,
        timestamp: new Date().getTime()
      });
      
      wx.showToast({
        title: '心情记录已更新',
        icon: 'success'
      });
    }
    
    // 保持兼容性，同时保存到旧的存储键
    wx.setStorageSync('todayMood', mood);
  },

  async addPoints(points) {
    try {
      // 调用云托管API增加积分
      const result = await getApp().callCloudAPI('/api/points/add', {
        amount: points,
        source: '完成任务',
        description: `完成任务获得${points}积分`
      });

      if (result && result.success) {
        // 统一更新所有积分相关存储
        this.updateAllPointsStorage(result.newBalance);
      }
    } catch (error) {
      console.error('增加积分失败:', error);
      // 如果云托管API失败，使用本地存储作为备用
      const currentPoints = wx.getStorageSync('points') || 0;
      const newPoints = currentPoints + points;
      
      // 统一更新所有积分相关存储
      this.updateAllPointsStorage(newPoints);
    }
  },

  // 统一更新所有积分相关存储的方法
  updateAllPointsStorage(newPoints) {
    try {
      // 更新主要积分存储
      wx.setStorageSync('points', newPoints);
      
      // 同步更新 userPoints（保持兼容性）
      wx.setStorageSync('userPoints', newPoints);
      
      // 更新用户信息中的积分字段
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.points = newPoints;
      userInfo.totalPoints = newPoints; // 同步更新总积分
      wx.setStorageSync('userInfo', userInfo);
      
      // 更新页面显示
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          points: newPoints
        }
      });
      
      console.log(`积分已同步更新为: ${newPoints}`);
    } catch (error) {
      console.error('更新积分存储失败:', error);
    }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
      fail: () => {
        wx.switchTab({
          url: url
        });
      }
    });
  },

  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  },

  onPullDownRefresh() {
    this.loadUserData();
    this.loadTodayTasks();
    this.loadAIQuote();
    wx.stopPullDownRefresh();
  }
});