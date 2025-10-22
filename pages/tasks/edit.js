// pages/tasks/edit.js
Page({
  data: {
    isEdit: false,
    taskId: null,
    taskForm: {
      title: '',
      category: '',
      points: 10,
      time: '',
      description: '',
      repeat: 'daily'
    },
    categories: [
      { value: 'life', name: '生活习惯', icon: '🏠' },
      { value: 'study', name: '学习成长', icon: '📚' },
      { value: 'health', name: '健康运动', icon: '💪' },
      { value: 'work', name: '工作事务', icon: '💼' },
      { value: 'social', name: '社交情感', icon: '❤️' },
      { value: 'hobby', name: '兴趣爱好', icon: '🎨' },
      { value: 'other', name: '其他', icon: '📝' }
    ],
    pointsOptions: [5, 10, 15, 20, 25, 30],
    repeatOptions: [
      { value: 'daily', name: '每天' },
      { value: 'weekly', name: '每周' },
      { value: 'monthly', name: '每月' },
      { value: 'once', name: '仅一次' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        taskId: parseInt(options.id)
      });
      this.loadTask();
    }
  },

  loadTask() {
    const tasks = wx.getStorageSync('userTasks') || [];
    const task = tasks.find(t => t.id === this.data.taskId);
    
    if (task) {
      this.setData({
        taskForm: {
          title: task.title || '',
          category: task.category || '',
          points: task.points || 10,
          time: task.time || '',
          description: task.description || '',
          repeat: task.repeat || 'daily'
        }
      });
    }
  },

  onTitleInput(e) {
    this.setData({
      'taskForm.title': e.detail.value
    });
  },

  onDescriptionInput(e) {
    this.setData({
      'taskForm.description': e.detail.value
    });
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      'taskForm.category': category
    });
  },

  selectPoints(e) {
    const points = e.currentTarget.dataset.points;
    this.setData({
      'taskForm.points': points
    });
  },

  selectRepeat(e) {
    const repeat = e.currentTarget.dataset.repeat;
    this.setData({
      'taskForm.repeat': repeat
    });
  },

  onTimeChange(e) {
    this.setData({
      'taskForm.time': e.detail.value
    });
  },

  onSave() {
    const { taskForm, isEdit, taskId } = this.data;
    
    // 表单验证
    if (!taskForm.title.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      });
      return;
    }

    if (!taskForm.category) {
      wx.showToast({
        title: '请选择任务分类',
        icon: 'none'
      });
      return;
    }

    // 获取现有任务列表
    let tasks = wx.getStorageSync('userTasks') || [];
    
    if (isEdit) {
      // 编辑现有任务
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...taskForm,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // 创建新任务
      const newTask = {
        id: Date.now(),
        ...taskForm,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(newTask);
    }

    // 保存到本地存储
    wx.setStorageSync('userTasks', tasks);

    wx.showToast({
      title: isEdit ? '任务已更新' : '任务已创建',
      icon: 'success'
    });

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  onCancel() {
    wx.navigateBack();
  }
});