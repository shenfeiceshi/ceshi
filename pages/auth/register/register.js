const app = getApp();

Page({
  data: {
    // 界面状态
    isLoading: false,
    // 表单数据
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    // 错误信息
    errors: {
      username: '',
      nickname: '',
      password: '',
      confirmPassword: ''
    },
    // 全局错误提示
    globalError: '',
    // 输入框聚焦状态
    focusStates: {
      username: false,
      nickname: false,
      password: false,
      confirmPassword: false
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
  },

  // 用户名输入
  onUsernameInput: function(e) {
    this.setData({
      username: e.detail.value,
      'errors.username': '',
      globalError: ''
    });
    // 实时验证
    this.validateUsername(e.detail.value);
  },

  // 昵称输入
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value,
      'errors.nickname': '',
      globalError: ''
    });
  },

  // 密码输入
  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value,
      'errors.password': '',
      globalError: ''
    });
    // 实时验证
    this.validatePassword(e.detail.value);
  },

  // 确认密码输入
  onConfirmPasswordInput: function(e) {
    this.setData({
      confirmPassword: e.detail.value,
      'errors.confirmPassword': '',
      globalError: ''
    });
    // 实时验证
    this.validateConfirmPassword(e.detail.value);
  },

  // 输入框聚焦事件
  onInputFocus: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`focusStates.${field}`]: true,
      globalError: ''
    });
  },

  // 输入框失焦事件
  onInputBlur: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`focusStates.${field}`]: false
    });
  },

  // 实时验证用户名
  validateUsername: function(username) {
    if (!username) return;
    
    if (username.length < 3) {
      this.setData({
        'errors.username': '用户名至少3位字符'
      });
    } else if (username.length > 20) {
      this.setData({
        'errors.username': '用户名不能超过20位字符'
      });
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      this.setData({
        'errors.username': '用户名只能包含字母、数字、下划线和中文'
      });
    }
  },

  // 实时验证密码
  validatePassword: function(password) {
    if (!password) return;
    
    if (password.length < 6) {
      this.setData({
        'errors.password': '密码至少6位字符'
      });
    } else if (password.length > 20) {
      this.setData({
        'errors.password': '密码不能超过20位字符'
      });
    }
  },

  // 实时验证确认密码
  validateConfirmPassword: function(confirmPassword) {
    if (!confirmPassword) return;
    
    if (confirmPassword !== this.data.password) {
      this.setData({
        'errors.confirmPassword': '两次输入的密码不一致'
      });
    }
  },

  // 表单验证
  validateForm: function() {
    const { username, password, confirmPassword } = this.data;
    const errors = {};
    let isValid = true;

    // 用户名验证
    if (!username.trim()) {
      errors.username = '请输入用户名';
      isValid = false;
    } else if (username.length < 3) {
      errors.username = '用户名至少3位字符';
      isValid = false;
    } else if (username.length > 20) {
      errors.username = '用户名不能超过20位字符';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      errors.username = '用户名只能包含字母、数字、下划线和中文';
      isValid = false;
    }

    // 密码验证
    if (!password.trim()) {
      errors.password = '请输入密码';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = '密码至少6位字符';
      isValid = false;
    } else if (password.length > 20) {
      errors.password = '密码不能超过20位字符';
      isValid = false;
    }

    // 确认密码验证
    if (!confirmPassword.trim()) {
      errors.confirmPassword = '请确认密码';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 解析错误信息
  parseErrorMessage: function(error) {
    const errorMsg = error.message || error.errMsg || '注册失败';
    
    // 根据错误信息返回用户友好的提示
    if (errorMsg.includes('用户名已存在') || errorMsg.includes('already exists')) {
      return '该用户名已被注册，请换一个试试';
    } else if (errorMsg.includes('用户名只能包含') || errorMsg.includes('username')) {
      return '用户名格式不正确，只能包含字母、数字、下划线，长度3-20位';
    } else if (errorMsg.includes('密码长度') || errorMsg.includes('password')) {
      return '密码长度不能少于6位';
    } else if (errorMsg.includes('网络') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
      return '网络连接失败，请检查网络后重试';
    } else if (errorMsg.includes('服务器') || errorMsg.includes('server') || errorMsg.includes('internal')) {
      return '服务器繁忙，请稍后重试';
    } else if (errorMsg.includes('参数') || errorMsg.includes('parameter')) {
      return '输入信息有误，请检查后重试';
    } else {
      return errorMsg;
    }
  },

  // 处理注册
  handleRegister: function() {
    if (this.data.isLoading) return;

    // 清除之前的全局错误
    this.setData({ globalError: '' });

    // 表单验证
    if (!this.validateForm()) {
      this.setData({
        globalError: '请检查输入信息是否正确'
      });
      return;
    }

    this.setData({ isLoading: true });

    const { username, password, nickname } = this.data;

    // 调用app.js中的注册方法
    app.userRegister(username, password, nickname || username, (err, data) => {
      this.setData({ isLoading: false });
      
      if (err) {
        const friendlyError = this.parseErrorMessage(err);
        
        // 设置全局错误信息
        this.setData({
          globalError: friendlyError
        });
        
        // 根据错误类型设置具体字段错误
        if (friendlyError.includes('用户名已被注册')) {
          this.setData({
            'errors.username': '该用户名已被注册'
          });
        } else if (friendlyError.includes('用户名格式')) {
          this.setData({
            'errors.username': '用户名格式不正确'
          });
        } else if (friendlyError.includes('密码长度')) {
          this.setData({
            'errors.password': '密码长度不能少于6位'
          });
        }
        
        // 显示Toast提示
        wx.showToast({
          title: friendlyError,
          icon: 'none',
          duration: 3000
        });
      } else {
        // 清除所有错误信息
        this.setData({
          globalError: '',
          errors: {
            username: '',
            nickname: '',
            password: '',
            confirmPassword: ''
          }
        });
        
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          // 注册成功后跳转到登录页面
          wx.redirectTo({
            url: '/pages/auth/login/login'
          });
        }, 1500);
      }
    });
  },

  // 跳转到登录页面
  goToLogin: function() {
    wx.redirectTo({
      url: '/pages/auth/login/login'
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});