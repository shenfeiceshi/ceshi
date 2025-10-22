// app.js
App({
  globalData: {
    userInfo: null,
    authType: null, // 'password' | 'wechat'
    token: null,
    refreshToken: null,
    cloudEnv: 'prod-8g0qvqhk7b8b8b8b' // 云环境ID
  },

  onLaunch: function () {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      });
    }
  },

  // 检查登录状态
  checkLoginStatus: function() {
    try {
      const token = wx.getStorageSync('auth_token');
      const userInfo = wx.getStorageSync('userInfo');
      const authType = wx.getStorageSync('user_auth_type');
      
      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        this.globalData.authType = authType || 'password';
        return true;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
    
    return false;
  },

  // 设置token
  setToken: function(token, refreshToken) {
    this.globalData.token = token;
    this.globalData.refreshToken = refreshToken;
    
    try {
      wx.setStorageSync('auth_token', token);
      if (refreshToken) {
        wx.setStorageSync('refresh_token', refreshToken);
      }
    } catch (error) {
      console.error('保存token失败:', error);
    }
  },

  // 清除登录信息
  clearAuth: function() {
    this.globalData.token = null;
    this.globalData.refreshToken = null;
    this.globalData.userInfo = null;
    this.globalData.authType = null;
    
    try {
      wx.removeStorageSync('auth_token');
      wx.removeStorageSync('refresh_token');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('user_auth_type');
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  },

  // 调用云函数API
  callCloudAPI: function(functionName, method, data, callback) {
    const that = this;
    
    wx.cloud.callFunction({
      name: 'api',
      data: {
        action: functionName,
        method: method,
        data: data,
        token: this.globalData.token
      },
      success: function(res) {
        if (res.result && res.result.success) {
          if (callback) callback(null, res.result.data);
        } else {
          const error = res.result ? res.result.error : { message: '请求失败' };
          if (callback) callback(error, null);
        }
      },
      fail: function(error) {
        console.error('云函数调用失败:', error);
        if (callback) callback(error, null);
      }
    });
  },

  // 用户登录
  userLogin: function(loginData, callback) {
    const that = this;
    const authUtils = require('./utils/auth.js');
    
    this.callCloudAPI('/api/auth/login', 'POST', loginData, (err, data) => {
      if (!err && data && data.success) {
        // 保存登录信息
        that.setToken(data.token, data.refreshToken);
        that.globalData.userInfo = data.userInfo;
        that.globalData.authType = 'password';
        
        wx.setStorageSync('user_auth_type', 'password');
        wx.setStorageSync('userInfo', data.userInfo);
        
        // 管理用户数据（新用户清空数据，老用户保留数据）
        try {
          const dataManageResult = authUtils.manageUserData(data.userInfo);
          if (dataManageResult) {
            console.log('用户数据管理成功');
          } else {
            console.error('用户数据管理失败');
          }
        } catch (error) {
          console.error('用户数据管理异常:', error);
        }
        
        if (callback) callback(null, data);
      } else {
        if (callback) callback(err || new Error('登录失败'), null);
      }
    });
  },

  // 用户注册
  userRegister: function(registerData, callback) {
    const that = this;
    const authUtils = require('./utils/auth.js');
    
    this.callCloudAPI('/api/auth/register', 'POST', registerData, (err, data) => {
      if (!err && data && data.success) {
        // 注册成功后自动登录
        that.setToken(data.token, data.refreshToken);
        that.globalData.userInfo = data.userInfo;
        that.globalData.authType = 'password';
        
        wx.setStorageSync('user_auth_type', 'password');
        wx.setStorageSync('userInfo', data.userInfo);
        
        // 新注册用户默认初始化数据
        try {
          const dataManageResult = authUtils.manageUserData(data.userInfo);
          if (dataManageResult) {
            console.log('新用户数据初始化成功');
          } else {
            console.error('新用户数据初始化失败');
          }
        } catch (error) {
          console.error('新用户数据初始化异常:', error);
        }
        
        if (callback) callback(null, data);
      } else {
        if (callback) callback(err || new Error('注册失败'), null);
      }
    });
  },

  // 修改密码
  changePassword: function(passwordData, callback) {
    this.callCloudAPI('/api/auth/change-password', 'POST', passwordData, callback);
  },

  // 用户登出
  userLogout: function(callback) {
    const that = this;
    
    this.callCloudAPI('/api/auth/logout', 'POST', {}, (err, data) => {
      // 无论成功失败都清除本地登录信息
      that.clearAuth();
      
      if (callback) callback(err, data);
    });
  }
});