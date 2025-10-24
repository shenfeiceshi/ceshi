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

  async loadTask() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'getTasks',
        data: {
          taskId: this.data.taskId
        }
      });
      
      if (result.success) {
        const task = result.data.task;
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
      } else {
        throw new Error(result.error || '加载任务失败');
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      wx.navigateBack();
    } finally {
      wx.hideLoading();
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

  async onSave() {
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

    try {
      wx.showLoading({ title: '保存中...' });
      
      let result;
      if (isEdit) {
        // 编辑现有任务
        result = await wx.cloud.callFunction({
          name: 'updateTask',
          data: {
            taskId: taskId,
            taskData: taskForm
          }
        });
      } else {
        // 创建新任务
        result = await wx.cloud.callFunction({
          name: 'addTask',
          data: {
            taskData: taskForm
          }
        });
      }
      
      if (result.success) {
        wx.showToast({
          title: isEdit ? '任务已更新' : '任务已创建',
          icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.error || '保存任务失败');
      }
    } catch (error) {
      console.error('保存任务失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});