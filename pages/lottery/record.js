// 抽奖记录页面
Page({
  data: {
    totalLotteries: 0, // 总抽奖次数
    totalWins: 0, // 中奖次数
    winRate: 0, // 中奖率
    filterType: 'all', // 筛选类型：all, win, recent
    records: [], // 所有记录
    filteredRecords: [], // 筛选后的记录
    hasMore: false, // 是否有更多数据
    loading: false, // 是否正在加载
    page: 1, // 当前页码
    pageSize: 20 // 每页数量
  },

  onLoad: function(options) {
    this.loadRecords();
  },

  onShow: function() {
    this.loadRecords();
  },

  // 加载抽奖记录
  loadRecords: function() {
    const records = wx.getStorageSync('lotteryRecords') || [];
    
    // 处理记录数据，添加时间格式化和emoji
    const processedRecords = records.map(record => {
      const date = new Date(record.timestamp);
      return {
        ...record,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        prizeEmoji: record.prizeEmoji || '🎁', // 确保有emoji
        isWin: true, // 存储的都是中奖记录
        cost: 10 // 抽奖消耗积分
      };
    });

    // 添加一些未中奖记录（模拟数据）
    const mockFailRecords = this.generateMockFailRecords();
    const allRecords = [...processedRecords, ...mockFailRecords];
    
    // 按时间倒序排列
    allRecords.sort((a, b) => b.timestamp - a.timestamp);

    // 计算统计信息
    const totalLotteries = allRecords.length;
    const totalWins = processedRecords.length;
    const winRate = totalLotteries > 0 ? Math.round((totalWins / totalLotteries) * 100) : 0;

    this.setData({
      records: allRecords,
      totalLotteries,
      totalWins,
      winRate
    });

    // 应用当前筛选
    this.applyFilter();
  },

  // 生成模拟的未中奖记录
  generateMockFailRecords: function() {
    const mockRecords = [];
    const now = Date.now();
    
    // 生成一些未中奖记录
    for (let i = 0; i < 15; i++) {
      const timestamp = now - (i + 1) * 3600000; // 每小时一条
      const date = new Date(timestamp);
      
      mockRecords.push({
        id: `fail_${timestamp}`,
        timestamp,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        prizeName: '谢谢参与',
        prizeEmoji: '😊', // 使用emoji替代图片
        isWin: false,
        cost: 10
      });
    }
    
    return mockRecords;
  },

  // 设置筛选类型
  setFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      filterType: type,
      page: 1
    });
    this.applyFilter();
  },

  // 应用筛选
  applyFilter: function() {
    const { records, filterType } = this.data;
    let filteredRecords = [...records];

    switch (filterType) {
      case 'win':
        filteredRecords = records.filter(record => record.isWin);
        break;
      case 'recent':
        const oneWeekAgo = Date.now() - 7 * 24 * 3600000;
        filteredRecords = records.filter(record => record.timestamp > oneWeekAgo);
        break;
      default:
        // 'all' - 显示所有记录
        break;
    }

    // 分页处理
    const pageSize = this.data.pageSize;
    const currentPageRecords = filteredRecords.slice(0, pageSize);
    const hasMore = filteredRecords.length > pageSize;

    this.setData({
      filteredRecords: currentPageRecords,
      hasMore,
      allFilteredRecords: filteredRecords // 保存完整的筛选结果用于加载更多
    });
  },

  // 加载更多
  loadMore: function() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    setTimeout(() => {
      const { page, pageSize, filteredRecords, allFilteredRecords } = this.data;
      const nextPage = page + 1;
      const startIndex = page * pageSize;
      const endIndex = nextPage * pageSize;
      
      const newRecords = allFilteredRecords.slice(startIndex, endIndex);
      const updatedRecords = [...filteredRecords, ...newRecords];
      const hasMore = endIndex < allFilteredRecords.length;

      this.setData({
        filteredRecords: updatedRecords,
        page: nextPage,
        hasMore,
        loading: false
      });
    }, 1000);
  },

  // 跳转到抽奖大厅
  goToLottery: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '我的抽奖记录',
      path: '/pages/lottery/record',
      imageUrl: '/images/share/lottery-record.png'
    };
  }
});