// 我的个人中心页面
Page({
  data: {
    userInfo: {
      nickname: '小六',
      avatar: '/images/default-avatar.png',
      level: 'Lv.3',
      totalPoints: 0
    },
    
    // 功能菜单
    menuItems: [
      {
        id: 'points-detail',
        title: '积分明细',
        icon: '📊',
        desc: '查看积分获得和使用记录',
        arrow: true
      },
      {
        id: 'settings',
        title: '设置',
        icon: '⚙️',
        desc: '个人设置和偏好',
        arrow: true
      },
      {
        id: 'help',
        title: '帮助与反馈',
        icon: '❓',
        desc: '使用帮助和问题反馈',
        arrow: true
      },
      {
        id: 'about',
        title: '关于我们',
        icon: 'ℹ️',
        desc: '了解更多关于成长日记',
        arrow: true
      }
    ],
    
    // 统计数据
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      totalDiaries: 0,
      continuousDays: 0
    }
  },

  onLoad: function(options) {
    this.loadUserInfo();
    this.loadStats();
  },

  onShow: function() {
    this.loadUserInfo();
    this.loadStats();
  },

  // 加载用户信息
  loadUserInfo: function() {
    try {
      // 统一使用 'points' 作为主要积分存储键
      const userPoints = wx.getStorageSync('points') || 0;
      const userInfo = wx.getStorageSync('userInfo') || {};
      
      // 确保用户信息中的积分与存储中的积分保持同步
      if (userInfo.points !== userPoints) {
        userInfo.points = userPoints;
        userInfo.totalPoints = userPoints;
        wx.setStorageSync('userInfo', userInfo);
      }
      
      this.setData({
        'userInfo.totalPoints': userPoints,
        'userInfo.nickname': userInfo.nickname || userInfo.nickName || '小六',
        'userInfo.avatar': userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png'
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 加载统计数据
  loadStats: function() {
    try {
      // 加载任务统计
      const tasks = wx.getStorageSync('tasks') || [];
      const completedTasks = tasks.filter(task => task.completed).length;
      
      // 加载日记统计
      const diaries = wx.getStorageSync('diaries') || [];
      
      // 计算连续天数（简化版本）
      const continuousDays = this.calculateContinuousDays();
      
      this.setData({
        'stats.totalTasks': tasks.length,
        'stats.completedTasks': completedTasks,
        'stats.totalDiaries': diaries.length,
        'stats.continuousDays': continuousDays
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 计算连续天数
  calculateContinuousDays: function() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      if (diaries.length === 0) return 0;
      
      // 简化计算，返回日记总数作为连续天数
      return Math.min(diaries.length, 30);
    } catch (error) {
      return 0;
    }
  },

  // 点击菜单项
  onMenuItemTap: function(e) {
    const itemId = e.currentTarget.dataset.id;
    
    switch (itemId) {
      case 'points-detail':
        wx.navigateTo({
          url: '/pages/profile/points-detail'
        });
        break;
      case 'settings':
        wx.navigateTo({
          url: '/pages/profile/settings'
        });
        break;
      case 'help':
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
        break;
      case 'about':
        wx.showModal({
          title: '关于成长日记',
          content: '成长日记是一款专为小学生设计的成长记录应用，帮助孩子养成良好的学习和生活习惯。',
          showCancel: false
        });
        break;
      default:
        console.log('未知菜单项:', itemId);
    }
  },

  // 点击头像
  onAvatarTap: function() {
    wx.showActionSheet({
      itemList: ['更换头像', '编辑昵称'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.changeAvatar();
        } else if (res.tapIndex === 1) {
          this.editNickname();
        }
      }
    });
  },

  // 选择并更新头像
  changeAvatar: function() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          'userInfo.avatar': tempFilePath
        });
        
        // 保存到本地存储
        try {
          const userInfo = wx.getStorageSync('userInfo') || {};
          userInfo.avatar = tempFilePath;
          wx.setStorageSync('userInfo', userInfo);
        } catch (error) {
          console.error('保存头像失败:', error);
        }
      }
    });
  },

  // 编辑昵称
  editNickname: function() {
    wx.showModal({
      title: '编辑昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'userInfo.nickname': res.content
          });
          
          // 保存到本地存储
          const userInfo = wx.getStorageSync('userInfo') || {};
          userInfo.nickname = res.content;
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '昵称更新成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadUserInfo();
    this.loadStats();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '我的成长日记',
      path: '/pages/profile/points'
    };
  }
});