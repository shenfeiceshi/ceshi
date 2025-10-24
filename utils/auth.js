/**
 * 认证相关工具函数 - 云开发版本
 */

// 检查登录状态
function checkLoginStatus() {
  const app = getApp();
  return app.globalData.isLoggedIn;
}

// 获取用户信息
function getUserInfo() {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    return userInfo || null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

// 保存用户信息
function saveUserInfo(userInfo) {
  try {
    wx.setStorageSync('userInfo', userInfo);
    const app = getApp();
    app.globalData.userInfo = userInfo;
    app.globalData.isLoggedIn = true;
    return true;
  } catch (error) {
    console.error('保存用户信息失败:', error);
    return false;
  }
}

// 清除登录信息
function clearLoginInfo() {
  try {
    wx.removeStorageSync('userInfo');
    const app = getApp();
    app.globalData.userInfo = null;
    app.globalData.isLoggedIn = false;
    return true;
  } catch (error) {
    console.error('清除登录信息失败:', error);
    return false;
  }
}

// 调用云函数的通用方法
function callCloudFunction(functionName, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: functionName,
      data: data,
      success: function(res) {
        if (res.result && res.result.success) {
          resolve(res.result.data);
        } else {
          const error = res.result ? res.result.error : '请求失败';
          reject(new Error(error));
        }
      },
      fail: function(error) {
        console.error(`云函数${functionName}调用失败:`, error);
        reject(error);
      }
    });
  });
}

// 获取所有需要管理的数据键名
function getAllDataKeys() {
  return [
    // 基础数据
    'points',
    'userTasks', 
    'diaries',
    'lotteryRecords',
    'pointsRecords',
    'diary_drafts',
    'achievements',
    'prizeList',
    'lotteryCost',
    'badges',
    'tasks',
    'userPoints',
    
    // 动态数据键（需要特殊处理）
    // tasks_YYYY-MM-DD 格式的任务状态
    // mood_YYYY-MM-DD 格式的心情记录
  ];
}

// 获取所有动态数据键（日期相关的数据）
function getDynamicDataKeys() {
  try {
    const info = wx.getStorageInfoSync();
    const keys = info.keys || [];
    
    // 筛选出日期相关的动态键
    const dynamicKeys = keys.filter(key => {
      return key.startsWith('tasks_') || 
             key.startsWith('mood_') ||
             key.match(/^\w+_\d{4}-\d{2}-\d{2}$/);
    });
    
    return dynamicKeys;
  } catch (error) {
    console.error('获取动态数据键失败:', error);
    return [];
  }
}

// 清空用户所有数据
function clearAllUserData() {
  try {
    console.log('开始清空用户数据...');
    
    // 清空固定数据键
    const staticKeys = getAllDataKeys();
    staticKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
        console.log(`已清空数据: ${key}`);
      } catch (error) {
        console.error(`清空数据失败 ${key}:`, error);
      }
    });
    
    // 清空动态数据键
    const dynamicKeys = getDynamicDataKeys();
    dynamicKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
        console.log(`已清空动态数据: ${key}`);
      } catch (error) {
        console.error(`清空动态数据失败 ${key}:`, error);
      }
    });
    
    // 特别确保积分相关数据完全清零
    try {
      wx.removeStorageSync('points');
      wx.removeStorageSync('userPoints');
      wx.removeStorageSync('pointsRecords');
      wx.removeStorageSync('totalPoints');
      console.log('积分相关数据已完全清零');
    } catch (error) {
      console.error('清零积分数据失败:', error);
    }
    
    console.log('用户数据清空完成');
    return true;
  } catch (error) {
    console.error('清空用户数据失败:', error);
    return false;
  }
}

// 初始化新用户默认数据
function initNewUserData() {
  try {
    console.log('开始初始化新用户数据...');
    
    // 初始化积分 - 确保所有积分相关字段都设为0
    wx.setStorageSync('points', 0);
    wx.setStorageSync('userPoints', 0);
    wx.setStorageSync('totalPoints', 0);
    
    // 初始化空数组
    wx.setStorageSync('userTasks', []);
    wx.setStorageSync('diaries', []);
    wx.setStorageSync('lotteryRecords', []);
    wx.setStorageSync('pointsRecords', []); // 清空积分记录
    wx.setStorageSync('diary_drafts', []);
    wx.setStorageSync('achievements', []);
    wx.setStorageSync('badges', []);
    wx.setStorageSync('tasks', []);
    
    // 初始化抽奖相关
    wx.setStorageSync('lotteryCost', 10);
    wx.setStorageSync('prizeList', []);
    
    // 更新用户信息中的积分字段
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        userInfo.points = 0;
        userInfo.totalPoints = 0;
        wx.setStorageSync('userInfo', userInfo);
        console.log('用户信息中的积分字段已重置为0');
      }
    } catch (error) {
      console.error('更新用户信息积分失败:', error);
    }
    
    console.log('新用户数据初始化完成，积分已设为0');
    return true;
  } catch (error) {
    console.error('初始化新用户数据失败:', error);
    return false;
  }
}

// 备份用户数据到特定用户空间
function backupUserData(userId) {
  try {
    console.log(`开始备份用户数据到用户空间: ${userId}`);
    
    const backupData = {};
    
    // 备份固定数据
    const staticKeys = getAllDataKeys();
    staticKeys.forEach(key => {
      try {
        const data = wx.getStorageSync(key);
        if (data !== '') {
          backupData[key] = data;
        }
      } catch (error) {
        console.error(`备份数据失败 ${key}:`, error);
      }
    });
    
    // 备份动态数据
    const dynamicKeys = getDynamicDataKeys();
    dynamicKeys.forEach(key => {
      try {
        const data = wx.getStorageSync(key);
        if (data !== '') {
          backupData[key] = data;
        }
      } catch (error) {
        console.error(`备份动态数据失败 ${key}:`, error);
      }
    });
    
    // 保存到用户专属空间
    wx.setStorageSync(`userData_${userId}`, backupData);
    console.log(`用户数据备份完成: ${userId}`);
    return true;
  } catch (error) {
    console.error('备份用户数据失败:', error);
    return false;
  }
}

// 恢复用户数据从特定用户空间
function restoreUserData(userId) {
  try {
    console.log(`开始恢复用户数据从用户空间: ${userId}`);
    
    const backupData = wx.getStorageSync(`userData_${userId}`);
    if (!backupData || typeof backupData !== 'object') {
      console.log('没有找到用户备份数据，将初始化新用户数据');
      return initNewUserData();
    }
    
    // 恢复所有备份的数据
    Object.keys(backupData).forEach(key => {
      try {
        wx.setStorageSync(key, backupData[key]);
        console.log(`已恢复数据: ${key}`);
      } catch (error) {
        console.error(`恢复数据失败 ${key}:`, error);
      }
    });
    
    console.log(`用户数据恢复完成: ${userId}`);
    return true;
  } catch (error) {
    console.error('恢复用户数据失败:', error);
    return false;
  }
}

// 检查是否为新用户
function isNewUser(userId) {
  try {
    const userData = wx.getStorageSync(`userData_${userId}`);
    return !userData || Object.keys(userData).length === 0;
  } catch (error) {
    console.error('检查新用户状态失败:', error);
    return true; // 出错时默认为新用户
  }
}

// 用户数据管理主函数
function manageUserData(userInfo) {
  try {
    if (!userInfo || !userInfo.id) {
      console.error('用户信息无效，无法管理数据');
      return false;
    }
    
    const userId = userInfo.id || userInfo.username || userInfo.account;
    console.log(`开始管理用户数据: ${userId}`);
    
    // 获取当前登录的用户ID
    const currentUserId = wx.getStorageSync('currentUserId');
    
    // 如果是同一个用户，不需要切换数据
    if (currentUserId === userId) {
      console.log('同一用户登录，无需切换数据');
      return true;
    }
    
    // 如果之前有用户登录，先备份当前数据
    if (currentUserId) {
      console.log(`备份当前用户数据: ${currentUserId}`);
      backupUserData(currentUserId);
    }
    
    // 清空当前数据
    clearAllUserData();
    
    // 检查是否为新用户
    if (isNewUser(userId)) {
      console.log('检测到新用户，初始化默认数据');
      initNewUserData();
    } else {
      console.log('检测到老用户，恢复历史数据');
      restoreUserData(userId);
    }
    
    // 记录当前用户ID
    wx.setStorageSync('currentUserId', userId);
    
    console.log(`用户数据管理完成: ${userId}`);
    return true;
  } catch (error) {
    console.error('用户数据管理失败:', error);
    return false;
  }
}

// 格式化错误信息
function formatErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && error.message) {
    return error.message;
  }
  
  if (error && error.errMsg) {
    return error.errMsg;
  }
  
  return '操作失败，请重试';
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 生成随机字符串
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 检查网络状态
function checkNetworkStatus() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none');
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

module.exports = {
  checkLoginStatus,
  getUserInfo,
  saveUserInfo,
  clearLoginInfo,
  callCloudFunction,
  formatErrorMessage,
  debounce,
  throttle,
  generateRandomString,
  formatTime,
  checkNetworkStatus,
  // 保留的用户数据管理函数（云开发环境下可能不需要，但保留以防万一）
  manageUserData,
  clearAllUserData,
  initNewUserData,
  backupUserData,
  restoreUserData,
  isNewUser
};