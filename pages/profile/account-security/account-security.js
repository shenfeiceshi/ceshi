// 账号安全管理页面
const app = getApp()
import Toast from '@vant/weapp/dist/toast/toast'
import Dialog from '@vant/weapp/dist/dialog/dialog'

Page({
  data: {
    // 修改密码表单
    passwordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    passwordErrors: {},
    isChangingPassword: false
  },

  onLoad() {
    // 页面加载时的初始化
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 当前密码输入
  onOldPasswordInput(e) {
    this.setData({
      'passwordForm.oldPassword': e.detail.value,
      'passwordErrors.oldPassword': ''
    })
  },

  // 新密码输入
  onNewPasswordInput(e) {
    this.setData({
      'passwordForm.newPassword': e.detail.value,
      'passwordErrors.newPassword': ''
    })
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      'passwordForm.confirmPassword': e.detail.value,
      'passwordErrors.confirmPassword': ''
    })
  },

  // 验证密码表单
  validatePasswordForm() {
    const { oldPassword, newPassword, confirmPassword } = this.data.passwordForm
    const errors = {}

    if (!oldPassword) {
      errors.oldPassword = '请输入当前密码'
    }

    if (!newPassword) {
      errors.newPassword = '请输入新密码'
    } else if (newPassword.length < 6 || newPassword.length > 20) {
      errors.newPassword = '密码长度应为6-20位'
    }

    if (!confirmPassword) {
      errors.confirmPassword = '请确认新密码'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    this.setData({ passwordErrors: errors })
    return Object.keys(errors).length === 0
  },

  // 修改密码
  async changePassword() {
    if (!this.validatePasswordForm()) {
      return
    }

    try {
      this.setData({ isChangingPassword: true })
      
      const { oldPassword, newPassword } = this.data.passwordForm
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 这里应该调用实际的修改密码API
      // const result = await app.callAuthAPI('/account/change-password', 'POST', {
      //   oldPassword,
      //   newPassword
      // })
      
      Toast.success('密码修改成功')
      
      // 清空表单
      this.setData({
        passwordForm: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        },
        passwordErrors: {}
      })
      
    } catch (error) {
      console.error('修改密码失败:', error)
      Toast.fail('修改密码失败，请重试')
    } finally {
      this.setData({ isChangingPassword: false })
    }
  }
})