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

  async loadTasks() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const app = getApp();
      const token = app.globalData.token || wx.getStorageSync('loginToken');
      const today = new Date().toISOString().split('T')[0];
      
      const result = await wx.cloud.callFunction({
        name: 'getTasks',
        data: {
          taskDate: today,
          token: token
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({
          tasks: result.result.data.tasks || []
        });
        this.filterTasks();
      } else {
        // 云函数返回失败，使用默认任务
        const defaultTasks = this.getDefaultTasks();
        this.setData({
          tasks: defaultTasks
        });
        this.filterTasks();
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      // 使用默认任务作为备用
      const defaultTasks = this.getDefaultTasks();
      this.setData({
        tasks: defaultTasks
      });
      this.filterTasks();
    } finally {
      wx.hideLoading();
    }
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

  async toggleTask(e) {
    const taskId = parseInt(e.currentTarget.dataset.id);
    const task = this.data.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    const newStatus = !task.completed;
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'updateTask',
        data: {
          taskId: taskId,
          completed: newStatus
        }
      });
      
      if (result.success) {
        // 更新本地状态
        const tasks = this.data.tasks.map(t => {
          if (t.id === taskId) {
            t.completed = newStatus;
          }
          return t;
        });

        this.setData({ tasks });

        // 如果是完成任务，显示积分奖励
        if (newStatus) {
          wx.showToast({
            title: `完成任务，获得${task.points}积分！`,
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '任务已取消完成',
            icon: 'none'
          });
        }

        this.filterTasks();
        this.calculateStats();
      } else {
        throw new Error(result.error || '更新任务状态失败');
      }
    } catch (error) {
      console.error('切换任务状态失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'error'
      });
    }
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
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteTask',
              data: {
                taskId: taskId
              }
            });
            
            if (result.success) {
              // 更新本地状态
              const tasks = this.data.tasks.filter(task => task.id !== taskId);
              this.setData({ tasks });
              
              this.filterTasks();
              this.calculateStats();
              wx.showToast({
                title: '任务已删除',
                icon: 'success'
              });
            } else {
              throw new Error(result.error || '删除任务失败');
            }
          } catch (error) {
            console.error('删除任务失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'error'
            });
          }
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