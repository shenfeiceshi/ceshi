/**
 * 统一加载状态管理工具
 */

class LoadingManager {
  constructor() {
    this.loadingCount = 0;
    this.loadingStates = new Map();
  }

  // 显示加载状态
  show(key = 'default', title = '加载中...') {
    if (!this.loadingStates.has(key)) {
      this.loadingCount++;
      this.loadingStates.set(key, true);
      
      if (this.loadingCount === 1) {
        wx.showLoading({
          title: title,
          mask: true
        });
      }
    }
  }

  // 隐藏加载状态
  hide(key = 'default') {
    if (this.loadingStates.has(key)) {
      this.loadingStates.delete(key);
      this.loadingCount--;
      
      if (this.loadingCount <= 0) {
        this.loadingCount = 0;
        wx.hideLoading();
      }
    }
  }

  // 隐藏所有加载状态
  hideAll() {
    this.loadingStates.clear();
    this.loadingCount = 0;
    wx.hideLoading();
  }

  // 检查是否正在加载
  isLoading(key = 'default') {
    return this.loadingStates.has(key);
  }

  // 获取加载状态数量
  getLoadingCount() {
    return this.loadingCount;
  }
}

// 创建全局实例
const loadingManager = new LoadingManager();

// 显示成功提示
function showSuccess(title = '操作成功', duration = 2000) {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration,
    mask: true
  });
}

// 显示错误提示
function showError(title = '操作失败', duration = 2000) {
  wx.showToast({
    title: title,
    icon: 'error',
    duration: duration,
    mask: true
  });
}

// 显示普通提示
function showToast(title, duration = 2000) {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: duration,
    mask: true
  });
}

// 显示确认对话框
function showConfirm(options = {}) {
  const defaultOptions = {
    title: '提示',
    content: '确定要执行此操作吗？',
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '#FF6B35'
  };

  const finalOptions = { ...defaultOptions, ...options };

  return new Promise((resolve) => {
    wx.showModal({
      ...finalOptions,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

// 显示操作菜单
function showActionSheet(itemList, title = '') {
  return new Promise((resolve) => {
    wx.showActionSheet({
      itemList: itemList,
      itemColor: '#333',
      success: (res) => {
        resolve(res.tapIndex);
      },
      fail: () => {
        resolve(-1);
      }
    });
  });
}

// 异步操作包装器
async function withLoading(asyncFn, loadingKey = 'default', loadingTitle = '加载中...') {
  try {
    loadingManager.show(loadingKey, loadingTitle);
    const result = await asyncFn();
    return result;
  } catch (error) {
    throw error;
  } finally {
    loadingManager.hide(loadingKey);
  }
}

// 带错误处理的异步操作
async function safeAsync(asyncFn, errorHandler = null) {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('异步操作失败:', error);
    
    if (errorHandler && typeof errorHandler === 'function') {
      errorHandler(error);
    } else {
      const errorMsg = error.message || error.errMsg || '操作失败，请重试';
      showError(errorMsg);
    }
    
    throw error;
  }
}

// 页面加载状态管理
class PageLoadingManager {
  constructor(page) {
    this.page = page;
    this.loadingStates = {};
  }

  // 设置加载状态
  setLoading(key, loading, loadingText = '加载中...') {
    this.loadingStates[key] = loading;
    
    const updateData = {};
    updateData[`${key}Loading`] = loading;
    
    if (loading && loadingText) {
      updateData[`${key}LoadingText`] = loadingText;
    }
    
    this.page.setData(updateData);
  }

  // 检查是否正在加载
  isLoading(key) {
    return !!this.loadingStates[key];
  }

  // 清除所有加载状态
  clearAll() {
    const updateData = {};
    Object.keys(this.loadingStates).forEach(key => {
      this.loadingStates[key] = false;
      updateData[`${key}Loading`] = false;
    });
    this.page.setData(updateData);
  }
}

// 创建页面加载管理器
function createPageLoadingManager(page) {
  return new PageLoadingManager(page);
}

module.exports = {
  loadingManager,
  showSuccess,
  showError,
  showToast,
  showConfirm,
  showActionSheet,
  withLoading,
  safeAsync,
  PageLoadingManager,
  createPageLoadingManager
};