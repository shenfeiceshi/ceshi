// pages/preview/preview.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'list' // 当前选中的预览标签
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('预览页面加载');
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '小六日记 - 界面预览'
    });
  },

  /**
   * 切换预览标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换预览标签:', tab);
    
    this.setData({
      currentTab: tab
    });
    
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 跳转到日记列表页面
   */
  goToList() {
    console.log('跳转到日记列表页面');
    
    wx.navigateTo({
      url: '/pages/diary/list',
      success: () => {
        wx.showToast({
          title: '进入日记列表',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'error',
          duration: 1500
        });
      }
    });
  },

  /**
   * 跳转到写日记页面
   */
  goToWrite() {
    console.log('跳转到写日记页面');
    
    wx.navigateTo({
      url: '/pages/diary/write',
      success: () => {
        wx.showToast({
          title: '开始写日记',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'error',
          duration: 1500
        });
      }
    });
  },

  /**
   * 分享当前页面
   */
  onShareAppMessage() {
    return {
      title: '小六日记 - 温馨的儿童日记应用',
      path: '/pages/preview/preview',
      imageUrl: '/images/share-preview.png' // 可以添加分享图片
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '小六日记 - 记录孩子成长的每一天',
      imageUrl: '/images/share-timeline.png' // 可以添加朋友圈分享图片
    };
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('预览页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('预览页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('预览页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('预览页面卸载');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('预览页面下拉刷新');
    
    // 模拟刷新操作
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新完成',
        icon: 'success',
        duration: 1000
      });
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('预览页面触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '小六日记 - 温馨的儿童成长记录',
      path: '/pages/preview/preview',
      success: (res) => {
        console.log('分享成功:', res);
        wx.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('分享失败:', err);
        wx.showToast({
          title: '分享失败',
          icon: 'error',
          duration: 1500
        });
      }
    };
  }
});