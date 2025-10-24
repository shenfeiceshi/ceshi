// 成就徽章页面
Page({
  data: {
    // 统计数据
    collectedCount: 0,
    totalCount: 0,
    completionRate: 0,
    
    // 筛选状态
    currentFilter: 'all',
    
    // 徽章数据
    badges: [],
    filteredBadges: [],
    recentBadges: [],
    
    // 弹窗状态
    showModal: false,
    selectedBadge: null,

    // 稀有度名称
    rarityNames: {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    }
  },

  onLoad() {
    this.loadBadges();
  },

  onShow() {
    this.loadBadges();
  },

  // 加载徽章数据
  async loadBadges() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'getUserBadges',
        data: {}
      });
      
      if (result.success && result.data) {
        this.setData({
          badges: result.data
        });
      } else {
        // 如果没有数据，使用默认徽章数据
        const defaultBadges = [
          {
            id: 1,
            name: '初来乍到',
            description: '完成第一个任务',
            icon: '/images/badges/first-task.png',
            rarity: 'common',
            collected: false,
            condition: '完成任意一个任务',
            reward: '获得10积分'
          },
          {
            id: 2,
            name: '勤奋小蜜蜂',
            description: '连续7天完成任务',
            icon: '/images/badges/hardworking.png',
            rarity: 'rare',
            collected: false,
            condition: '连续7天完成至少1个任务',
            reward: '获得50积分'
          },
          {
            id: 3,
            name: '学习达人',
            description: '累计学习100小时',
            icon: '/images/badges/study-master.png',
            rarity: 'epic',
            collected: false,
            progress: {
              current: 0,
              total: 100
            },
            condition: '累计学习时长达到100小时',
            reward: '获得100积分和特殊称号'
          }
        ];
        
        this.setData({
          badges: defaultBadges
        });
      }
      
      this.calculateStats();
      this.filterBadges();
      this.loadRecentBadges();
    } catch (error) {
      console.error('加载徽章数据失败:', error);
      this.setData({
        badges: []
      });
      this.calculateStats();
      this.filterBadges();
      this.loadRecentBadges();
    } finally {
      wx.hideLoading();
    }
  },

  // 计算统计数据
  calculateStats() {
    const { badges } = this.data;
    const collectedCount = badges.filter(badge => badge.collected).length;
    const totalCount = badges.length;
    const completionRate = Math.round((collectedCount / totalCount) * 100);

    this.setData({
      collectedCount,
      totalCount,
      completionRate
    });
  },

  // 切换筛选条件
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterBadges();
  },

  // 筛选徽章
  filterBadges() {
    const { badges, currentFilter } = this.data;
    let filteredBadges = badges;

    switch (currentFilter) {
      case 'collected':
        filteredBadges = badges.filter(badge => badge.collected);
        break;
      case 'uncollected':
        filteredBadges = badges.filter(badge => !badge.collected);
        break;
      case 'recent':
        filteredBadges = badges
          .filter(badge => badge.collected)
          .sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt))
          .slice(0, 6);
        break;
      default:
        filteredBadges = badges;
    }

    this.setData({
      filteredBadges
    });
  },

  // 加载最近获得的徽章
  loadRecentBadges() {
    const { badges } = this.data;
    const recentBadges = badges
      .filter(badge => badge.collected)
      .sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt))
      .slice(0, 5);

    this.setData({
      recentBadges
    });
  },

  // 显示徽章详情
  showBadgeDetail(e) {
    const badge = e.currentTarget.dataset.badge;
    this.setData({
      selectedBadge: badge,
      showModal: true
    });
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showModal: false,
      selectedBadge: null
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 页面分享
  onShareAppMessage() {
    const { selectedBadge } = this.data;
    
    if (selectedBadge && selectedBadge.collected) {
      return {
        title: `我获得了"${selectedBadge.name}"徽章！`,
        path: '/pages/index/index',
        imageUrl: selectedBadge.icon
      };
    }
    
    return {
      title: '成长日记 - 我的成就徽章',
      path: '/pages/index/index'
    };
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadBadges();
    wx.stopPullDownRefresh();
  }
});