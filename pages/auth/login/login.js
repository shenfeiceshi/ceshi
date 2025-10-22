const app = getApp();

Page({
  data: {
    // 表单数据
    formData: {
      account: '',
      password: ''
    },
    
    // 表单验证
    errors: {
      account: '',
      password: ''
    },
    
    // 界面状态
    isLoading: false,
    showPassword: false
  },

  onLoad: function(options) {
    // 检查是否已经登录
    if (app.checkLoginStatus && app.checkLoginStatus()) {
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

  // 输入框内容变化
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },

  // 切换密码显示状态
  togglePassword: function() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 表单验证
  validateForm: function() {
    const { account, password } = this.data.formData;
    const errors = {};
    let isValid = true;

    // 验证账号
    if (!account.trim()) {
      errors.account = '请输入账号';
      isValid = false;
    } else if (account.length < 3) {
      errors.account = '账号长度不能少于3位';
      isValid = false;
    }

    // 验证密码
    if (!password) {
      errors.password = '请输入密码';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = '密码长度不能少于6位';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 处理登录
  handleLogin: function() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isLoading: true });

    const { account, password } = this.data.formData;
    const loginData = {
      account: account.trim(),
      password: password
    };

    // 引入用户数据管理工具
    const authUtils = require('../../../utils/auth.js');

    // 模拟登录API调用
    setTimeout(() => {
      // 这里应该调用实际的登录API
      // app.userLogin(loginData, (err, data) => {
      //   this.setData({ isLoading: false });
      //   
      //   if (err) {
      //     wx.showToast({
      //       title: err.message || '登录失败',
      //       icon: 'none'
      //     });
      //     return;
      //   }
      //
      //   // 登录成功后处理用户数据
      //   this.handleLoginSuccess(data.userInfo);
      // });

      // 模拟登录成功 - 创建模拟用户信息
      const mockUserInfo = {
        id: account.trim(), // 使用账号作为用户ID
        username: account.trim(),
        account: account.trim(),
        nickname: account.trim(),
        avatar: '/images/default-avatar.png',
        points: 0
      };

      // 处理登录成功
      this.handleLoginSuccess(mockUserInfo);
    }, 2000);
  },

  // 处理登录成功
  handleLoginSuccess: function(userInfo) {
    const authUtils = require('../../../utils/auth.js');
    
    try {
      // 保存用户登录信息
      wx.setStorageSync('token', 'mock_token_' + Date.now());
      wx.setStorageSync('userInfo', userInfo);
      
      // 管理用户数据（新用户清空数据，老用户保留数据）
      const dataManageResult = authUtils.manageUserData(userInfo);
      
      if (dataManageResult) {
        console.log('用户数据管理成功');
      } else {
        console.error('用户数据管理失败');
      }
      
      this.setData({ isLoading: false });
      
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
      this.setData({ isLoading: false });
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