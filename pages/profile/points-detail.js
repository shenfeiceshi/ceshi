// 积分明细页面
Page({
  data: {
    // 积分统计
    pointsStats: {
      totalPoints: 0,
      monthlyEarned: 0,
      monthlySpent: 0
    },
    
    // 筛选条件
    timeFilter: 'all', // all, today, week, month
    typeFilter: 'all', // all, earn, spend
    searchKeyword: '',
    
    // 记录数据
    allRecords: [],
    filteredRecords: [],
    
    // 分页
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    
    // 弹窗
    showDetailModal: false,
    selectedRecord: null
  },

  onLoad: function(options) {
    this.loadPointsData();
    this.loadRealPointsRecords();
    this.calculateStats();
    this.filterRecords();
  },

  onShow: function() {
    // 刷新积分数据
    this.loadPointsData();
    this.loadRealPointsRecords();
    this.calculateStats();
    this.filterRecords();
  },

  // 加载用户积分数据
  async loadPointsData() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      });
      
      if (result.success) {
        const userInfo = result.data.userInfo;
        this.setData({
          'pointsStats.totalPoints': userInfo.points || 0
        });
      } else {
        this.setData({
          'pointsStats.totalPoints': 0
        });
      }
    } catch (error) {
      console.error('加载积分数据失败:', error);
      this.setData({
        'pointsStats.totalPoints': 0
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载积分记录数据
  async loadRealPointsRecords() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getPointsRecords',
        data: {
          page: 1,
          pageSize: 100
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({
          allRecords: result.result.data.records || []
        });
      } else {
        this.setData({
          allRecords: []
        });
      }
    } catch (error) {
      console.error('加载积分记录失败:', error);
      this.setData({
        allRecords: []
      });
    }
  },



  // 格式化日期
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 计算积分统计
  calculateStats: function() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthlyEarned = 0;
    let monthlySpent = 0;
    
    this.data.allRecords.forEach(record => {
      const recordDate = new Date(record.date.replace(/-/g, '/'));
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        if (record.type === 'earn') {
          monthlyEarned += record.amount;
        } else {
          monthlySpent += record.amount;
        }
      }
    });
    
    this.setData({
      'pointsStats.monthlyEarned': monthlyEarned,
      'pointsStats.monthlySpent': monthlySpent
    });
  },

  // 设置时间筛选
  setTimeFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      timeFilter: filter,
      currentPage: 1
    });
    this.filterRecords();
  },

  // 设置类型筛选
  setTypeFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      typeFilter: filter,
      currentPage: 1
    });
    this.filterRecords();
  },

  // 搜索输入
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      currentPage: 1
    });
    
    // 防抖处理
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filterRecords();
    }, 300);
  },

  // 清除搜索
  clearSearch: function() {
    this.setData({
      searchKeyword: '',
      currentPage: 1
    });
    this.filterRecords();
  },

  // 筛选记录
  filterRecords: function() {
    let filtered = [...this.data.allRecords];
    
    // 时间筛选
    if (this.data.timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        
        switch (this.data.timeFilter) {
          case 'today':
            return recordDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return recordDate >= weekAgo;
          case 'month':
            return recordDate.getMonth() === now.getMonth() && 
                   recordDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }
    
    // 类型筛选
    if (this.data.typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === this.data.typeFilter);
    }
    
    // 搜索筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(record => 
        record.source.toLowerCase().includes(keyword) ||
        (record.description && record.description.toLowerCase().includes(keyword))
      );
    }
    
    // 按时间倒序排列
    filtered.sort((a, b) => {
      // 使用iOS兼容的日期格式
      const dateA = new Date(a.date.replace(/-/g, '/') + ' ' + a.time + ':00');
      const dateB = new Date(b.date.replace(/-/g, '/') + ' ' + b.time + ':00');
      return dateB - dateA;
    });
    
    // 分页处理
    const pageSize = this.data.pageSize;
    const currentPage = this.data.currentPage;
    const startIndex = 0;
    const endIndex = currentPage * pageSize;
    const paginatedRecords = filtered.slice(startIndex, endIndex);
    
    this.setData({
      filteredRecords: paginatedRecords,
      hasMore: endIndex < filtered.length
    });
  },

  // 加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        loading: true,
        currentPage: this.data.currentPage + 1
      });
      
      setTimeout(() => {
        this.filterRecords();
        this.setData({
          loading: false
        });
      }, 500);
    }
  },

  // 查看记录详情
  viewRecordDetail: function(e) {
    const record = e.currentTarget.dataset.record;
    this.setData({
      selectedRecord: record,
      showDetailModal: true
    });
  },

  // 关闭详情弹窗
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      selectedRecord: null
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // 查看相关任务
  viewRelatedTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    console.log('查看相关任务:', taskId);
    
    // 这里可以根据taskId跳转到相应的任务详情页面
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },



  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadPointsData();
    this.loadRealPointsRecords();
    this.calculateStats();
    this.setData({
      currentPage: 1
    });
    this.filterRecords();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '我的积分明细',
      path: '/pages/profile/points-detail'
    };
  }
});