// 设置页面
Page({
  data: {
    // 用户信息
    userInfo: {
      avatar: '/images/default-avatar.png',
      nickname: '小朋友'
    },
    
    // 编辑弹窗
    showEditModal: false,
    editTitle: '',
    editPlaceholder: '',
    editValue: '',
    editType: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        userInfo: {
          avatar: userInfo.avatar || '/images/default-avatar.png',
          nickname: userInfo.nickname || '小朋友'
        }
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 保存用户信息
  saveUserInfo() {
    try {
      wx.setStorageSync('userInfo', this.data.userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 更换头像
  changeAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          'userInfo.avatar': tempFilePath
        });
        that.saveUserInfo();
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail() {
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  // 编辑昵称
  editNickname() {
    this.setData({
      showEditModal: true,
      editTitle: '修改昵称',
      editPlaceholder: '请输入昵称',
      editValue: this.data.userInfo.nickname,
      editType: 'nickname'
    });
  },

  // 隐藏编辑弹窗
  hideEditModal() {
    this.setData({
      showEditModal: false,
      editTitle: '',
      editPlaceholder: '',
      editValue: '',
      editType: ''
    });
  },

  // 编辑输入
  onEditInput(e) {
    this.setData({
      editValue: e.detail.value
    });
  },

  // 确认编辑
  confirmEdit() {
    const { editType, editValue } = this.data;
    
    if (!editValue.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    if (editType === 'nickname') {
      this.setData({
        'userInfo.nickname': editValue.trim()
      });
      this.saveUserInfo();
      
      wx.showToast({
        title: '昵称修改成功',
        icon: 'success'
      });
    }

    this.hideEditModal();
  },

  // 跳转到账号安全管理
  goToAccountSecurity() {
    wx.navigateTo({
      url: '/pages/profile/account-security/account-security'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('refreshToken');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          
          // 返回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  }
});