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
  loadPointsData: function() {
    try {
      // 检查是否为新用户
      const diaries = wx.getStorageSync('diaries') || [];
      const userTasks = wx.getStorageSync('userTasks') || [];
      const pointsRecords = wx.getStorageSync('pointsRecords') || [];
      const currentPoints = wx.getStorageSync('points') || 0;
      
      // 判断是否为新用户（没有任何历史数据）
      const isNewUser = diaries.length === 0 && 
                       userTasks.length === 0 && 
                       pointsRecords.length === 0 && 
                       currentPoints === 0;
      
      // 新用户显示0积分，老用户显示实际积分
      const userPoints = isNewUser ? 0 : currentPoints;
      
      this.setData({
        'pointsStats.totalPoints': userPoints
      });
    } catch (error) {
      console.error('加载积分数据失败:', error);
    }
  },

  // 加载真实的积分记录数据
  loadRealPointsRecords: function() {
    try {
      // 从本地存储获取真实的积分记录
      let pointsRecords = wx.getStorageSync('pointsRecords') || [];
      
      // 检查当前积分和用户信息
      const currentPoints = wx.getStorageSync('points') || 0;
      const userInfo = wx.getStorageSync('userInfo') || {};
      
      // 如果积分为0或数据已清空，直接显示空状态，不创建任何初始记录
      if (currentPoints === 0) {
        console.log('当前积分为0，显示空状态');
        this.setData({
          allRecords: []
        });
        return;
      }
      
      // 只有当用户有积分且没有记录时才创建初始记录
      if (pointsRecords.length === 0 && currentPoints > 0) {
        pointsRecords = this.createInitialRecords();
        wx.setStorageSync('pointsRecords', pointsRecords);
      }
      
      // 重新计算余额逻辑
      if (pointsRecords.length > 0) {
        pointsRecords = this.recalculateBalances(pointsRecords);
      }
      
      this.setData({
        allRecords: pointsRecords
      });
      
      // 保存修正后的记录
      if (pointsRecords.length > 0) {
        wx.setStorageSync('pointsRecords', pointsRecords);
      }
    } catch (error) {
      console.error('加载积分记录失败:', error);
      // 如果加载失败，设置为空数组
      this.setData({
        allRecords: []
      });
    }
  },

  // 创建初始积分记录
  createInitialRecords: function() {
    const currentPoints = wx.getStorageSync('userPoints') || 70;
    const now = new Date();
    
    return [
      {
        id: 1,
        type: 'spend',
        amount: 20,
        source: '抽奖消耗',
        description: '参与幸运大转盘抽奖',
        date: this.formatDate(now),
        time: '15:45',
        balance: currentPoints,
        lotteryId: 'lottery_001'
      },
      {
        id: 2,
        type: 'earn',
        amount: 50,
        source: '完成日记任务',
        description: '今天写了一篇关于春游的日记',
        date: this.formatDate(now),
        time: '14:30',
        balance: currentPoints + 20,
        taskId: 'diary_001'
      },
      {
        id: 3,
        type: 'earn',
        amount: 25,
        source: '完成作业',
        description: '按时完成数学作业',
        date: this.formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        time: '19:20',
        balance: currentPoints - 30,
        taskId: 'homework_001'
      }
    ];
  },

  // 重新计算所有记录的余额
  recalculateBalances: function(records) {
    if (!records || records.length === 0) return records;
    
    // 获取当前总积分
    const currentPoints = wx.getStorageSync('userPoints') || 70;
    
    // 按时间排序（最新的在前）
    records.sort((a, b) => {
      // 使用iOS兼容的日期格式
      const dateA = new Date(a.date.replace(/-/g, '/') + ' ' + a.time + ':00');
      const dateB = new Date(b.date.replace(/-/g, '/') + ' ' + b.time + ':00');
      return dateB - dateA;
    });
    
    // 从最新记录开始，往前推算每条记录的余额
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (i === 0) {
        // 最新记录的余额就是当前总积分
        record.balance = currentPoints;
      } else {
        // 前一条记录的余额 = 后一条记录的余额 ± 当前记录的发生额
        const nextRecord = records[i - 1];
        const nextBalance = nextRecord.balance;
        
        if (record.type === 'earn') {
          // 如果是获得积分，前一条余额 = 后一条余额 - 当前获得额
          record.balance = nextBalance - record.amount;
        } else {
          // 如果是消费积分，前一条余额 = 后一条余额 + 当前消费额
          record.balance = nextBalance + record.amount;
        }
      }
    }
    
    return records;
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
    // 检查是否为新用户
    const diaries = wx.getStorageSync('diaries') || [];
    const userTasks = wx.getStorageSync('userTasks') || [];
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 判断是否为新用户（没有任何历史数据）
    const isNewUser = diaries.length === 0 && 
                     userTasks.length === 0 && 
                     pointsRecords.length === 0 && 
                     currentPoints === 0;
    
    // 如果是新用户，直接设置为0
    if (isNewUser) {
      this.setData({
        'pointsStats.monthlyEarned': 0,
        'pointsStats.monthlySpent': 0
      });
      return;
    }
    
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