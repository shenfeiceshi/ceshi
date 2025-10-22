// pages/tasks/list.js
Page({
  data: {
    currentTab: 'all',
    todayStats: {
      completed: 0,
      total: 0,
      points: 0
    },
    tasks: [],
    filteredTasks: []
  },

  onLoad() {
    this.loadTasks();
    this.calculateStats();
  },

  onShow() {
    this.loadTasks();
    this.calculateStats();
  },

  loadTasks() {
    // 从本地存储加载任务
    const tasks = wx.getStorageSync('userTasks') || this.getDefaultTasks();
    const todayKey = this.getTodayKey();
    const todayTaskStatus = wx.getStorageSync(`tasks_${todayKey}`) || {};

    // 更新任务完成状态
    const updatedTasks = tasks.map(task => ({
      ...task,
      completed: todayTaskStatus[task.id] || false
    }));

    this.setData({
      tasks: updatedTasks
    });

    this.filterTasks();
  },

  getDefaultTasks() {
    return [
      {
        id: 1,
        title: '早起打卡',
        category: '生活习惯',
        points: 10,
        time: '07:00',
        completed: false
      },
      {
        id: 2,
        title: '刷牙洗脸',
        category: '个人卫生',
        points: 5,
        time: '07:30',
        completed: false
      },
      {
        id: 3,
        title: '阅读30分钟',
        category: '学习成长',
        points: 15,
        time: '19:00',
        completed: false
      },
      {
        id: 4,
        title: '运动锻炼',
        category: '健康运动',
        points: 20,
        time: '16:00',
        completed: false
      },
      {
        id: 5,
        title: '整理房间',
        category: '生活习惯',
        points: 10,
        time: '20:00',
        completed: false
      }
    ];
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.filterTasks();
  },

  filterTasks() {
    const { tasks, currentTab } = this.data;
    let filteredTasks = tasks;

    switch (currentTab) {
      case 'pending':
        filteredTasks = tasks.filter(task => !task.completed);
        break;
      case 'completed':
        filteredTasks = tasks.filter(task => task.completed);
        break;
      default:
        filteredTasks = tasks;
    }

    this.setData({
      filteredTasks
    });
  },

  toggleTask(e) {
    const taskId = parseInt(e.currentTarget.dataset.id);
    const tasks = this.data.tasks.map(task => {
      if (task.id === taskId) {
        task.completed = !task.completed;
      }
      return task;
    });

    this.setData({
      tasks
    });

    // 保存任务状态到本地存储
    const todayKey = this.getTodayKey();
    const todayTaskStatus = {};
    tasks.forEach(task => {
      todayTaskStatus[task.id] = task.completed;
    });
    wx.setStorageSync(`tasks_${todayKey}`, todayTaskStatus);

    // 如果是完成任务，给予积分奖励
    const task = tasks.find(t => t.id === taskId);
    if (task && task.completed) {
      this.addPoints(task.points);
      wx.showToast({
        title: `完成任务，获得${task.points}积分！`,
        icon: 'success'
      });
    } else if (task && !task.completed) {
      wx.showToast({
        title: '任务已取消完成',
        icon: 'none'
      });
    }

    this.filterTasks();
    this.calculateStats();
  },

  editTask(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tasks/edit?id=${taskId}`
    });
  },

  deleteTask(e) {
    const taskId = parseInt(e.currentTarget.dataset.id);
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          const tasks = this.data.tasks.filter(task => task.id !== taskId);
          this.setData({
            tasks
          });
          wx.setStorageSync('userTasks', tasks);
          
          // 同时清理今日任务状态中的记录
          const todayKey = this.getTodayKey();
          const todayTaskStatus = wx.getStorageSync(`tasks_${todayKey}`) || {};
          delete todayTaskStatus[taskId];
          wx.setStorageSync(`tasks_${todayKey}`, todayTaskStatus);
          
          this.filterTasks();
          this.calculateStats();
          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  addTask() {
    wx.navigateTo({
      url: '/pages/tasks/edit'
    });
  },

  calculateStats() {
    const { tasks } = this.data;
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const points = tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + task.points, 0);

    this.setData({
      todayStats: {
        completed,
        total,
        points
      }
    });
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
      
      console.log(`任务页面积分已同步更新为: ${newPoints}`);
    } catch (error) {
      console.error('任务页面更新积分存储失败:', error);
    }
  },

  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  },

  onPullDownRefresh() {
    this.loadTasks();
    this.calculateStats();
    wx.stopPullDownRefresh();
  }
});