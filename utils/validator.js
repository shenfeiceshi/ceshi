/**
 * 表单验证工具
 */

// 验证规则定义
const VALIDATION_RULES = {
  required: {
    validator: (value) => value !== null && value !== undefined && value !== '',
    message: '此字段为必填项'
  },
  
  email: {
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: '请输入有效的邮箱地址'
  },
  
  phone: {
    validator: (value) => /^1[3-9]\d{9}$/.test(value),
    message: '请输入有效的手机号码'
  },
  
  password: {
    validator: (value) => {
      if (!value || value.length < 6) return false;
      if (value.length > 20) return false;
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      return hasLetter && hasNumber;
    },
    message: '密码必须包含字母和数字，长度6-20位'
  },
  
  confirmPassword: {
    validator: (value, formData, fieldName) => {
      const passwordField = fieldName.replace('confirm', '').toLowerCase();
      return value === formData[passwordField];
    },
    message: '两次输入的密码不一致'
  },
  
  verifyCode: {
    validator: (value) => /^\d{6}$/.test(value),
    message: '请输入6位数字验证码'
  },
  
  minLength: (length) => ({
    validator: (value) => value && value.length >= length,
    message: `最少输入${length}个字符`
  }),
  
  maxLength: (length) => ({
    validator: (value) => !value || value.length <= length,
    message: `最多输入${length}个字符`
  }),
  
  pattern: (regex, message) => ({
    validator: (value) => regex.test(value),
    message: message || '格式不正确'
  })
};

// 表单验证器类
class FormValidator {
  constructor(rules = {}) {
    this.rules = rules;
    this.errors = {};
  }

  // 添加验证规则
  addRule(fieldName, rule) {
    if (!this.rules[fieldName]) {
      this.rules[fieldName] = [];
    }
    this.rules[fieldName].push(rule);
  }

  // 验证单个字段
  validateField(fieldName, value, formData = {}) {
    const fieldRules = this.rules[fieldName];
    if (!fieldRules || fieldRules.length === 0) {
      return { valid: true, message: '' };
    }

    for (let rule of fieldRules) {
      let ruleConfig = rule;
      
      // 如果是字符串，从预定义规则中获取
      if (typeof rule === 'string') {
        ruleConfig = VALIDATION_RULES[rule];
      }
      
      // 如果是函数，执行函数获取规则配置
      if (typeof rule === 'function') {
        ruleConfig = rule();
      }

      if (ruleConfig && ruleConfig.validator) {
        const isValid = ruleConfig.validator(value, formData, fieldName);
        if (!isValid) {
          return {
            valid: false,
            message: ruleConfig.message || '验证失败'
          };
        }
      }
    }

    return { valid: true, message: '' };
  }

  // 验证整个表单
  validateForm(formData) {
    this.errors = {};
    let isValid = true;

    for (let fieldName in this.rules) {
      const result = this.validateField(fieldName, formData[fieldName], formData);
      if (!result.valid) {
        this.errors[fieldName] = result.message;
        isValid = false;
      }
    }

    return {
      valid: isValid,
      errors: this.errors
    };
  }

  // 获取字段错误信息
  getFieldError(fieldName) {
    return this.errors[fieldName] || '';
  }

  // 清除错误信息
  clearErrors() {
    this.errors = {};
  }

  // 清除指定字段错误
  clearFieldError(fieldName) {
    delete this.errors[fieldName];
  }
}

// 创建常用的验证器
function createLoginValidator() {
  const validator = new FormValidator();
  
  validator.addRule('account', 'required');
  validator.addRule('account', (value) => {
    const isEmail = VALIDATION_RULES.email.validator(value);
    const isPhone = VALIDATION_RULES.phone.validator(value);
    
    if (!isEmail && !isPhone) {
      return {
        validator: () => false,
        message: '请输入有效的邮箱或手机号'
      };
    }
    
    return {
      validator: () => true,
      message: ''
    };
  });
  
  validator.addRule('password', 'required');
  validator.addRule('password', 'password');
  
  return validator;
}

function createRegisterValidator() {
  const validator = new FormValidator();
  
  validator.addRule('account', 'required');
  validator.addRule('account', (value) => {
    const isEmail = VALIDATION_RULES.email.validator(value);
    const isPhone = VALIDATION_RULES.phone.validator(value);
    
    if (!isEmail && !isPhone) {
      return {
        validator: () => false,
        message: '请输入有效的邮箱或手机号'
      };
    }
    
    return {
      validator: () => true,
      message: ''
    };
  });
  
  validator.addRule('verifyCode', 'required');
  validator.addRule('verifyCode', 'verifyCode');
  validator.addRule('password', 'required');
  validator.addRule('password', 'password');
  validator.addRule('confirmPassword', 'required');
  validator.addRule('confirmPassword', 'confirmPassword');
  
  return validator;
}

function createForgotPasswordValidator() {
  const validator = new FormValidator();
  
  validator.addRule('account', 'required');
  validator.addRule('account', (value) => {
    const isEmail = VALIDATION_RULES.email.validator(value);
    const isPhone = VALIDATION_RULES.phone.validator(value);
    
    if (!isEmail && !isPhone) {
      return {
        validator: () => false,
        message: '请输入有效的邮箱或手机号'
      };
    }
    
    return {
      validator: () => true,
      message: ''
    };
  });
  
  validator.addRule('verifyCode', 'required');
  validator.addRule('verifyCode', 'verifyCode');
  validator.addRule('newPassword', 'required');
  validator.addRule('newPassword', 'password');
  validator.addRule('confirmPassword', 'required');
  validator.addRule('confirmPassword', (value, formData) => {
    return {
      validator: (val) => val === formData.newPassword,
      message: '两次输入的密码不一致'
    };
  });
  
  return validator;
}

function createChangePasswordValidator() {
  const validator = new FormValidator();
  
  validator.addRule('oldPassword', 'required');
  validator.addRule('newPassword', 'required');
  validator.addRule('newPassword', 'password');
  validator.addRule('confirmPassword', 'required');
  validator.addRule('confirmPassword', (value, formData) => {
    return {
      validator: (val) => val === formData.newPassword,
      message: '两次输入的密码不一致'
    };
  });
  
  return validator;
}

// 实时验证混入
const realtimeValidationMixin = {
  data: {
    formErrors: {},
    formTouched: {}
  },

  // 字段失去焦点时验证
  onFieldBlur(fieldName, value) {
    if (this.validator) {
      this.setData({
        [`formTouched.${fieldName}`]: true
      });
      
      const result = this.validator.validateField(fieldName, value, this.data.formData || {});
      this.setData({
        [`formErrors.${fieldName}`]: result.valid ? '' : result.message
      });
    }
  },

  // 字段输入时清除错误
  onFieldInput(fieldName) {
    if (this.data.formTouched[fieldName] && this.data.formErrors[fieldName]) {
      this.setData({
        [`formErrors.${fieldName}`]: ''
      });
    }
  },

  // 获取字段错误样式类
  getFieldErrorClass(fieldName) {
    return this.data.formErrors[fieldName] ? 'error' : '';
  },

  // 清除所有表单错误
  clearFormErrors() {
    this.setData({
      formErrors: {},
      formTouched: {}
    });
  }
};

module.exports = {
  VALIDATION_RULES,
  FormValidator,
  createLoginValidator,
  createRegisterValidator,
  createForgotPasswordValidator,
  createChangePasswordValidator,
  realtimeValidationMixin
};