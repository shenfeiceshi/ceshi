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
    currentMood: '',
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

  // 监听全局数据变化
  onGlobalDataChange() {
    this.checkLoginStatus();
    this.loadUserData();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    
    // 使用 app.js 中的全局登录状态
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      const userInfo = app.globalData.userInfo;
      this.setData({
        hasUserInfo: true,
        userInfo: {
          nickName: userInfo.nickname || userInfo.nickName || '用户',
          avatarUrl: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
          points: userInfo.points || 0,
          id: userInfo.userId || userInfo._id || ''
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

  // 跳转到我的页面
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/points'
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

  async loadUserData() {
    try {
      const app = getApp();
      
      // 如果用户已登录，使用 app.js 中的用户信息
      if (app.globalData.isLoggedIn && app.globalData.userInfo) {
        const userInfo = app.globalData.userInfo;
        
        this.setData({
          userInfo: {
            nickName: userInfo.nickname || userInfo.nickName || '小朋友',
            avatarUrl: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
            points: userInfo.points || 0,
            id: userInfo.userId || userInfo._id || '12345678'
          },
          hasUserInfo: true
        });
      } else {
        // 未登录状态
        this.setData({
          userInfo: {
            nickName: '小朋友',
            avatarUrl: '/images/default-avatar.png',
            points: 0,
            id: '12345678'
          },
          hasUserInfo: false
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 使用默认数据
      this.setData({
        userInfo: {
          nickName: '小朋友',
          avatarUrl: '/images/default-avatar.png',
          points: 0,
          id: '12345678'
        },
        hasUserInfo: false
      });
    }
  },

  // 更新用户信息（供其他页面调用）
  updateUserInfo(userInfo) {
    if (userInfo && userInfo.nickname) {
      this.setData({
        userInfo: {
          nickName: userInfo.nickname || userInfo.nickName || '小朋友',
          avatarUrl: userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
          points: userInfo.points || 0,
          id: userInfo.userId || userInfo._id || '12345678'
        },
        hasUserInfo: true
      });
    }
  },

  async loadTodayTasks() {
    try {
      const app = getApp();
      const token = app.globalData.token || wx.getStorageSync('loginToken');
      const todayKey = this.getTodayKey();
      
      // 如果有token，尝试获取用户任务
      if (token) {
        const result = await wx.cloud.callFunction({
          name: 'getTasks',
          data: { 
            taskDate: todayKey,
            token: token
          }
        });
        
        if (result.result && result.result.success) {
          const tasks = result.result.data.tasks || [];
          
          // 筛选出未完成的任务，最多显示4个
          const incompleteTasks = tasks.filter(task => !task.completed);
          const quickTasks = incompleteTasks.slice(0, 4);
          
          // 计算完成的任务数量
          const completedTasks = tasks.filter(task => task.completed);
          
          this.setData({
            quickTasks,
            taskProgress: {
              completed: completedTasks.length,
              total: tasks.length
            }
          });
        } else {
          // 云函数返回失败，使用默认任务
          const defaultTasks = this.getDefaultTasks();
          this.setData({
            quickTasks: defaultTasks.slice(0, 4),
            taskProgress: {
              completed: 0,
              total: defaultTasks.length
            }
          });
        }
      } else {
        // 没有token，使用默认任务
        const defaultTasks = this.getDefaultTasks();
        this.setData({
          quickTasks: defaultTasks.slice(0, 4),
          taskProgress: {
            completed: 0,
            total: defaultTasks.length
          }
        });
      }
    } catch (error) {
      console.error('加载今日任务失败:', error);
      // 使用默认任务
      const defaultTasks = this.getDefaultTasks();
      this.setData({
        quickTasks: defaultTasks.slice(0, 4),
        taskProgress: {
          completed: 0,
          total: defaultTasks.length
        }
      });
    }
    
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

  async onQuickCheckin(e) {
    const taskId = parseInt(e.currentTarget.dataset.id);
    
    try {
      wx.showLoading({ title: '更新中...' });
      
      const app = getApp();
      const token = app.globalData.token || wx.getStorageSync('loginToken');
      
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      // 使用云函数更新任务状态
      const result = await wx.cloud.callFunction({
        name: 'updateTask',
        data: {
          taskId: taskId,
          completed: true,
          token: token
        }
      });
      
      if (result.result && result.result.success) {
        const task = result.result.data.task;
        
        // 如果是完成任务，给予积分奖励
        if (task && task.completed) {
          wx.showToast({
            title: `完成${task.title}，获得${task.points || 10}积分！`,
            icon: 'success'
          });
        }
        
        // 重新加载任务显示
        this.loadTodayTasks();
        // 重新加载用户数据以更新积分
        this.loadUserData();
      } else {
        throw new Error(result.result?.error || '更新任务失败');
      }
    } catch (error) {
      console.error('快速打卡失败:', error);
      wx.showToast({
        title: '打卡失败，请重试',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  async onSelectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    const todayKey = this.getTodayKey();
    
    this.setData({ currentMood: mood });
    
    try {
      wx.showLoading({ title: '记录中...' });
      
      const app = getApp();
      const token = app.globalData.token || wx.getStorageSync('loginToken');
      
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      // 使用云函数记录心情
      const result = await wx.cloud.callFunction({
        name: 'recordMood',
        data: {
          mood: mood,
          date: todayKey,
          token: token
        }
      });
      
      if (result.result && result.result.success) {
        if (result.result.isFirstRecord) {
          wx.showToast({
            title: '心情记录成功，获得5积分！',
            icon: 'success'
          });
          // 重新加载用户数据以更新积分
          this.loadUserData();
        } else {
          wx.showToast({
            title: '心情记录已更新',
            icon: 'success'
          });
        }
      } else {
        throw new Error(result.result.error || '心情记录失败');
      }
    } catch (error) {
      console.error('记录心情失败:', error);
      wx.showToast({
        title: '记录失败，请重试',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
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