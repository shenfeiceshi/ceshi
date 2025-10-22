const app = getApp();

Page({
  data: {
    // 表单数据
    formData: {
      account: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    },
    
    // 表单验证
    errors: {
      account: '',
      password: '',
      confirmPassword: ''
    },
    
    // 界面状态
    isLoading: false,
    showPassword: false,
    showConfirmPassword: false
  },

  onLoad: function(options) {
    // 检查是否已经登录
    if (app.checkLoginStatus && app.checkLoginStatus()) {
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }
  },

  // 输入框内容变化
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
  },

  // 切换密码显示状态
  togglePassword: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'password') {
      this.setData({
        showPassword: !this.data.showPassword
      });
    } else if (type === 'confirmPassword') {
      this.setData({
        showConfirmPassword: !this.data.showConfirmPassword
      });
    }
  },

  // 切换协议同意状态
  toggleAgreeTerms: function() {
    this.setData({
      'formData.agreeTerms': !this.data.formData.agreeTerms
    });
  },

  // 验证表单
  validateForm: function() {
    const { account, password, confirmPassword, agreeTerms } = this.data.formData;
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
    } else if (password.length < 6 || password.length > 20) {
      errors.password = '密码长度应为6-20位';
      isValid = false;
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请确认密码';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    // 验证协议
    if (!agreeTerms) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      });
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 提交注册
  submitRegister: function() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isLoading: true });

    const { account, password } = this.data.formData;
    const registerData = {
      account: account.trim(),
      password: password
    };

    // 模拟注册API调用
    setTimeout(() => {
      // 这里应该调用实际的注册API
      // app.userRegister(registerData, (err, data) => {
      //   this.setData({ isLoading: false });
      //   
      //   if (err) {
      //     wx.showToast({
      //       title: err.message || '注册失败',
      //       icon: 'none'
      //     });
      //     return;
      //   }
      //
      //   // 注册成功，跳转到登录页面
      //   wx.showToast({
      //     title: '注册成功',
      //     icon: 'success'
      //   });
      //   
      //   setTimeout(() => {
      //     this.goToLogin();
      //   }, 1500);
      // });

      // 模拟注册成功
      this.setData({ isLoading: false });
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        this.goToLogin();
      }, 1500);
    }, 2000);
  },

  // 跳转到登录页面
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
  },


});