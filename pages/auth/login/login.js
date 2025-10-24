const app = getApp();

Page({
  data: {
    // 界面状态
    isLoading: false,
    // 表单数据
    username: '',
    password: '',
    // 错误信息
    errors: {
      username: '',
      password: ''
    }
  },

  onLoad: function(options) {
    // 检查是否已经登录
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }
    
    // 如果有重定向参数，保存起来
    if (options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      });
    }
  },

  // 用户名输入
  onUsernameInput: function(e) {
    this.setData({
      username: e.detail.value,
      'errors.username': ''
    });
  },

  // 密码输入
  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value,
      'errors.password': ''
    });
  },

  // 表单验证
  validateForm: function() {
    const { username, password } = this.data;
    const errors = {};
    let isValid = true;

    if (!username.trim()) {
      errors.username = '请输入用户名';
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = '请输入密码';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 账号密码登录
  handleLogin: function() {
    if (this.data.isLoading) return;

    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isLoading: true });

    const { username, password } = this.data;

    // 调用app.js中的登录方法
    app.userLogin(username, password, (err, data) => {
      this.setData({ isLoading: false });
      
      if (err) {
        wx.showToast({
          title: err.message || '登录失败',
          icon: 'none'
        });
      } else {
        this.handleLoginSuccess(data.userInfo);
      }
    });
  },

  // 处理登录成功
  handleLoginSuccess: function(userInfo) {
    try {
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        const redirectUrl = this.data.redirectUrl || '/pages/index/index';
        if (redirectUrl.startsWith('/pages/index/index')) {
          wx.switchTab({ url: redirectUrl });
        } else {
          wx.navigateTo({ url: redirectUrl });
        }
      }, 1500);
      
    } catch (error) {
      console.error('登录成功处理失败:', error);
      wx.showToast({
        title: '登录处理失败',
        icon: 'none'
      });
    }
  },

  // 跳转到注册页面
  goToRegister: function() {
    wx.navigateTo({
      url: '/pages/auth/register/register'
    });
  },

  // 跳转到测试页面
  goToTest: function() {
    wx.navigateTo({
      url: '/pages/test-user-data/test-user-data'
    });
  }
});