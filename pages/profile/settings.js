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
  async loadUserInfo() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      });
      
      if (result.result && result.result.success) {
        const userInfo = result.result.data.userInfo;
        this.setData({
          userInfo: {
            avatar: userInfo.avatarUrl || '/images/default-avatar.png',
            nickname: userInfo.nickname || '小朋友'
          }
        });
      } else {
        // 使用默认值
        this.setData({
          userInfo: {
            avatar: '/images/default-avatar.png',
            nickname: '小朋友'
          }
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      // 使用默认值
      this.setData({
        userInfo: {
          avatar: '/images/default-avatar.png',
          nickname: '小朋友'
        }
      });
    } finally {
      wx.hideLoading();
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
      success: async function(res) {
        const tempFilePath = res.tempFilePaths[0];
        
        try {
          wx.showLoading({ title: '上传中...' });
          
          // 上传到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `avatars/${Date.now()}-${Math.random()}.jpg`,
            filePath: tempFilePath
          });
          
          // 更新用户信息
          const result = await wx.cloud.callFunction({
            name: 'updateProfile',
            data: {
              avatarUrl: uploadResult.fileID
            }
          });
          
          if (result.result && result.result.success) {
            that.setData({
              'userInfo.avatar': uploadResult.fileID
            });
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
          } else {
            throw new Error(result.result.error || '头像更新失败');
          }
        } catch (error) {
          console.error('更换头像失败:', error);
          wx.showToast({
            title: '头像更新失败',
            icon: 'error'
          });
        } finally {
          wx.hideLoading();
        }
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
  async confirmEdit() {
    const { editType, editValue } = this.data;
    
    if (!editValue.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    if (editType === 'nickname') {
      try {
        wx.showLoading({ title: '保存中...' });
        
        const result = await wx.cloud.callFunction({
          name: 'updateProfile',
          data: {
            nickname: editValue.trim()
          }
        });
        
        if (result.result && result.result.success) {
          this.setData({
            'userInfo.nickname': editValue.trim()
          });
          
          wx.showToast({
            title: '昵称修改成功',
            icon: 'success'
          });
        } else {
          throw new Error(result.result.error || '昵称修改失败');
        }
      } catch (error) {
        console.error('修改昵称失败:', error);
        wx.showToast({
          title: '昵称修改失败',
          icon: 'error'
        });
      } finally {
        wx.hideLoading();
      }
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