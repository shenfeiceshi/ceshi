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
    
    // 通知首页更新用户信息
    const pages = getCurrentPages();
    const indexPage = pages.find(page => page.route === 'pages/index/index');
    if (indexPage && indexPage.updateUserInfo) {
      indexPage.updateUserInfo(getApp().globalData.userInfo);
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const app = getApp();
      const token = app.globalData.token;
      
      if (!token) {
        // 未登录状态，使用默认数据
        this.setData({
          'userInfo.totalPoints': 0,
          'userInfo.nickname': '小六',
          'userInfo.avatar': '/images/default-avatar.png',
          'userInfo.level': 'Lv.1'
        });
        return;
      }
      
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: { token }
      });
      
      if (result.result && result.result.success) {
        const userInfo = result.result.data.userInfo;
        this.setData({
          'userInfo.totalPoints': userInfo.points || 0,
          'userInfo.nickname': userInfo.nickname || userInfo.nickName || '小六',
          'userInfo.avatar': userInfo.avatar || userInfo.avatarUrl || '/images/default-avatar.png',
          'userInfo.level': userInfo.level || 'Lv.1'
        });
      } else {
        // 云函数返回失败，使用默认数据
        this.setData({
          'userInfo.totalPoints': 0,
          'userInfo.nickname': '小六',
          'userInfo.avatar': '/images/default-avatar.png',
          'userInfo.level': 'Lv.1'
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      // 使用默认值
      this.setData({
        'userInfo.totalPoints': 0,
        'userInfo.nickname': '小六',
        'userInfo.avatar': '/images/default-avatar.png',
        'userInfo.level': 'Lv.1'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const app = getApp();
      const token = app.globalData.token;
      
      if (!token) {
        // 未登录状态，使用默认数据
        this.setData({
          'stats.totalTasks': 0,
          'stats.completedTasks': 0,
          'stats.totalDiaries': 0,
          'stats.continuousDays': 0
        });
        return;
      }
      
      const result = await wx.cloud.callFunction({
        name: 'getPoints',
        data: {
          type: 'stats',
          token
        }
      });
      
      if (result.result && result.result.success) {
        const stats = result.result.data.stats;
        this.setData({
          'stats.totalTasks': stats.totalTasks || 0,
          'stats.completedTasks': stats.completedTasks || 0,
          'stats.totalDiaries': stats.totalDiaries || 0,
          'stats.continuousDays': stats.continuousDays || 0
        });
      } else {
        // 云函数返回失败，使用默认数据
        this.setData({
          'stats.totalTasks': 0,
          'stats.completedTasks': 0,
          'stats.totalDiaries': 0,
          'stats.continuousDays': 0
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 使用默认值
      this.setData({
        'stats.totalTasks': 0,
        'stats.completedTasks': 0,
        'stats.totalDiaries': 0,
        'stats.continuousDays': 0
      });
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
          content: '成长日记是一款专为小学生设计的成长记录应用，可以帮助孩子养成良好的学习和生活习惯。',
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
  async changeAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async function(res) {
        const tempFilePath = res.tempFilePaths[0];
        
        try {
          wx.showLoading({ title: '上传中...' });
          
          const result = await wx.cloud.callFunction({
            name: 'updateUserInfo',
            data: {
              avatarPath: tempFilePath
            }
          });
          
          if (result.success) {
            that.setData({
              'userInfo.avatar': result.data.avatarUrl || tempFilePath
            });
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
          } else {
            throw new Error(result.error || '头像更新失败');
          }
        } catch (error) {
          console.error('保存头像失败:', error);
          wx.showToast({
            title: '头像更新失败',
            icon: 'error'
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  // 编辑昵称
  editNickname: function() {
    const that = this;
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: async function(res) {
        if (res.confirm && res.content) {
          try {
            wx.showLoading({ title: '保存中...' });
            
            const result = await wx.cloud.callFunction({
              name: 'updateUserInfo',
              data: {
                nickname: res.content
              }
            });
            
            if (result.success) {
              that.setData({
                'userInfo.nickname': res.content
              });
              
              wx.showToast({
                title: '昵称更新成功',
                icon: 'success'
              });
            } else {
              throw new Error(result.error || '昵称更新失败');
            }
          } catch (error) {
            console.error('保存昵称失败:', error);
            wx.showToast({
              title: '昵称更新失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
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