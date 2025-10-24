// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: null
  },

  onLaunch: function () {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        // 云开发环境ID
        env: 'cloud1-7gqey5at68494012',
        traceUser: true
      });
    }
    
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const that = this;
    
    // 检查本地存储的登录信息
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const loginToken = wx.getStorageSync('loginToken');
      
      if (userInfo && loginToken) {
        // 先设置为已登录状态，避免页面闪烁
        that.globalData.userInfo = userInfo;
        that.globalData.isLoggedIn = true;
        that.globalData.token = loginToken;
        
        // 异步验证token是否有效
        wx.cloud.callFunction({
          name: 'verifyToken',
          data: { token: loginToken },
          success: function(res) {
            if (res.result && res.result.success) {
              // token有效，保持登录状态
              console.log('Token验证成功，用户已登录');
              // 更新用户信息（如果返回了新的用户信息）
              if (res.result.data && res.result.data.userInfo) {
                that.globalData.userInfo = res.result.data.userInfo;
                wx.setStorageSync('userInfo', res.result.data.userInfo);
              }
            } else {
              // token无效，清除登录信息
              console.log('Token验证失败，清除登录信息');
              that.clearAuth();
            }
          },
          fail: function(error) {
            console.error('验证token失败:', error);
            // 网络错误时保持登录状态，避免频繁登出
            console.log('网络错误，保持当前登录状态');
          }
        });
      } else {
        that.globalData.isLoggedIn = false;
        that.globalData.userInfo = null;
        that.globalData.token = null;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      that.globalData.isLoggedIn = false;
      that.globalData.userInfo = null;
      that.globalData.token = null;
    }
  },

  // 设置用户信息
  setUserInfo: function(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.token = token;
    
    try {
      wx.setStorageSync('userInfo', userInfo);
      if (token) {
        wx.setStorageSync('loginToken', token);
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  },

  // 清除登录信息
  clearAuth: function() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.token = null;
    
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('loginToken');
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  },

  // 调用云函数
  callCloudFunction: function(functionName, data, callback) {
    wx.cloud.callFunction({
      name: functionName,
      data: data || {},
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

  // 用户登录（账号密码登录）
  userLogin: function(username, password, callback) {
    const that = this;
    
    // 验证输入参数
    if (!username || !password) {
      if (callback) callback(new Error('用户名和密码不能为空'), null);
      return;
    }
    
    // 调用登录云函数
    that.callCloudFunction('login', {
      username: username,
      password: password
    }, (err, data) => {
       if (!err && data) {
         that.setUserInfo(data.userInfo, data.token);
         if (callback) callback(null, data);
       } else {
         if (callback) callback(err || new Error('登录失败'), null);
       }
     });
  },

  // 用户注册
  userRegister: function(username, password, nickname, callback) {
    const that = this;
    
    // 验证输入参数
    if (!username || !password) {
      if (callback) callback(new Error('用户名和密码不能为空'), null);
      return;
    }
    
    // 调用注册云函数
    that.callCloudFunction('register', {
      username: username,
      password: password,
      nickname: nickname || username
    }, (err, data) => {
      if (!err && data) {
        if (callback) callback(null, data);
      } else {
        if (callback) callback(err || new Error('注册失败'), null);
      }
    });
  },

  // 用户登出
  userLogout: function(callback) {
    const that = this;
    
    // 清除本地登录信息
    that.clearAuth();
    
    if (callback) callback(null, { success: true });
  }
});