// 账号绑定页面
Page({
  data: {
    // 绑定类型：phone 或 email
    bindType: 'phone',
    
    // 表单数据
    account: '',
    verifyCode: '',
    password: '',
    confirmPassword: '',
    
    // 验证码相关
    codeSent: false,
    countdown: 0,
    countdownTimer: null,
    
    // 页面状态
    loading: false,
    
    // 用户信息
    userInfo: null,
    
    // 表单验证
    errors: {
      account: '',
      verifyCode: '',
      password: '',
      confirmPassword: ''
    }
  },

  onLoad(options) {
    // 获取绑定类型
    const bindType = options.type || 'phone';
    this.setData({
      bindType: bindType
    });
    
    // 获取用户信息
    this.loadUserInfo();
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: bindType === 'phone' ? '绑定手机号' : '绑定邮箱'
    });
  },

  onUnload() {
    // 清理定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: userInfo
    });
  },

  // 切换绑定类型
  onBindTypeChange(e) {
    const bindType = e.detail.value;
    this.setData({
      bindType: bindType,
      account: '',
      verifyCode: '',
      password: '',
      confirmPassword: '',
      codeSent: false,
      countdown: 0,
      errors: {
        account: '',
        verifyCode: '',
        password: '',
        confirmPassword: ''
      }
    });
    
    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: bindType === 'phone' ? '绑定手机号' : '绑定邮箱'
    });
  },

  // 账号输入
  onAccountInput(e) {
    const account = e.detail.value;
    this.setData({
      account: account,
      'errors.account': ''
    });
  },

  // 验证码输入
  onVerifyCodeInput(e) {
    const verifyCode = e.detail.value;
    this.setData({
      verifyCode: verifyCode,
      'errors.verifyCode': ''
    });
  },

  // 密码输入
  onPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      password: password,
      'errors.password': ''
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    const confirmPassword = e.detail.value;
    this.setData({
      confirmPassword: confirmPassword,
      'errors.confirmPassword': ''
    });
  },

  // 验证账号格式
  validateAccount() {
    const { account, bindType } = this.data;
    
    if (!account.trim()) {
      this.setData({
        'errors.account': bindType === 'phone' ? '请输入手机号' : '请输入邮箱地址'
      });
      return false;
    }
    
    if (bindType === 'phone') {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(account)) {
        this.setData({
          'errors.account': '请输入正确的手机号格式'
        });
        return false;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(account)) {
        this.setData({
          'errors.account': '请输入正确的邮箱格式'
        });
        return false;
      }
    }
    
    return true;
  },

  // 验证密码
  validatePassword() {
    const { password, confirmPassword } = this.data;
    
    if (!password.trim()) {
      this.setData({
        'errors.password': '请输入密码'
      });
      return false;
    }
    
    if (password.length < 6 || password.length > 20) {
      this.setData({
        'errors.password': '密码长度应为6-20位'
      });
      return false;
    }
    
    // 密码必须包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      this.setData({
        'errors.password': '密码必须包含字母和数字'
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      this.setData({
        'errors.confirmPassword': '两次输入的密码不一致'
      });
      return false;
    }
    
    return true;
  },

  // 发送验证码
  sendVerifyCode() {
    if (!this.validateAccount()) {
      return;
    }
    
    if (this.data.countdown > 0) {
      return;
    }
    
    const { account, bindType } = this.data;
    
    wx.showLoading({
      title: '发送中...',
      mask: true
    });
    
    // 调用发送验证码云函数
    getApp().callCloudFunction('sendVerifyCode', {
      account: account,
      type: 'bind',
      bindType: bindType
    }).then(result => {
      wx.hideLoading();
      
      if (result.success) {
        // 开始倒计时
        this.startCountdown();
        
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        });
        
        this.setData({
          codeSent: true
        });
      } else {
        wx.showToast({
          title: result.error || '发送失败，请重试',
          icon: 'none'
        });
      }
    }).catch(error => {
      wx.hideLoading();
      console.error('发送验证码失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
    });
  },

  // 开始倒计时
  startCountdown() {
    this.setData({
      countdown: 60
    });
    
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({
          countdown: 0,
          countdownTimer: null
        });
      } else {
        this.setData({
          countdown: countdown
        });
      }
    }, 1000);
    
    this.setData({
      countdownTimer: timer
    });
  },

  // 提交绑定
  submitBind() {
    // 验证表单
    if (!this.validateAccount()) {
      return;
    }
    
    if (!this.data.verifyCode.trim()) {
      this.setData({
        'errors.verifyCode': '请输入验证码'
      });
      return;
    }
    
    if (!this.validatePassword()) {
      return;
    }
    
    if (this.data.loading) {
      return;
    }
    
    this.setData({
      loading: true
    });
    
    const { account, verifyCode, password, bindType, userInfo } = this.data;
    
    wx.showLoading({
      title: '绑定中...',
      mask: true
    });
    
    // 调用绑定云函数
    getApp().callCloudFunction('bindAccount', {
      account: account,
      verifyCode: verifyCode,
      password: password,
      bindType: bindType
    }).then(result => {
      wx.hideLoading();
      this.setData({
        loading: false
      });
      
      if (result.success) {
        // 绑定成功
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        });
        
        // 更新本地用户信息
        if (result.data && result.data.userInfo) {
          wx.setStorageSync('userInfo', result.data.userInfo);
          getApp().globalData.userInfo = result.data.userInfo;
        }
        
        // 延迟跳转
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        let errorMsg = result.error || '绑定失败，请重试';
        
        // 根据错误类型设置具体的错误信息
        if (errorMsg.includes('验证码')) {
          this.setData({
            'errors.verifyCode': '验证码错误或已过期'
          });
        } else if (errorMsg.includes('已存在') || errorMsg.includes('已被绑定')) {
          this.setData({
            'errors.account': bindType === 'phone' ? '该手机号已被绑定' : '该邮箱已被绑定'
          });
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
      }
    }).catch(error => {
      wx.hideLoading();
      this.setData({
        loading: false
      });
      
      console.error('绑定账号失败:', error);
      wx.showToast({
        title: '绑定失败，请重试',
        icon: 'none'
      });
    });
  },


});