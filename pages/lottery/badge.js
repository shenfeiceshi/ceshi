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
  loadBadges() {
    // 模拟徽章数据
    const mockBadges = [
      {
        id: 1,
        name: '初来乍到',
        description: '完成第一个任务',
        icon: '/images/badges/first-task.png',
        rarity: 'common',
        collected: true,
        collectedAt: '2024-01-15',
        condition: '完成任意一个任务',
        reward: '获得10积分'
      },
      {
        id: 2,
        name: '勤奋小蜜蜂',
        description: '连续7天完成任务',
        icon: '/images/badges/hardworking.png',
        rarity: 'rare',
        collected: true,
        collectedAt: '2024-01-20',
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
          current: 65,
          total: 100
        },
        condition: '累计学习时长达到100小时',
        reward: '获得100积分和特殊称号'
      },
      {
        id: 4,
        name: '阅读之星',
        description: '阅读50本书籍',
        icon: '/images/badges/reading-star.png',
        rarity: 'rare',
        collected: false,
        progress: {
          current: 23,
          total: 50
        },
        condition: '完成50本书籍的阅读',
        reward: '获得阅读专属头像框'
      },
      {
        id: 5,
        name: '运动健将',
        description: '累计运动300小时',
        icon: '/images/badges/sports-champion.png',
        rarity: 'epic',
        collected: false,
        progress: {
          current: 120,
          total: 300
        },
        condition: '累计运动时长达到300小时',
        reward: '获得运动装备奖励'
      },
      {
        id: 6,
        name: '创意大师',
        description: '完成10个创意项目',
        icon: '/images/badges/creative-master.png',
        rarity: 'legendary',
        collected: false,
        progress: {
          current: 3,
          total: 10
        },
        condition: '完成10个不同类型的创意项目',
        reward: '获得创意工具包和专属称号'
      },
      {
        id: 7,
        name: '友谊之光',
        description: '帮助同学10次',
        icon: '/images/badges/friendship.png',
        rarity: 'rare',
        collected: true,
        collectedAt: '2024-01-18',
        condition: '帮助其他同学完成任务10次',
        reward: '获得友谊徽章和30积分'
      },
      {
        id: 8,
        name: '时间管理者',
        description: '准时完成任务30次',
        icon: '/images/badges/time-manager.png',
        rarity: 'epic',
        collected: false,
        progress: {
          current: 18,
          total: 30
        },
        condition: '在截止时间前完成任务30次',
        reward: '获得时间管理工具和称号'
      }
    ];

    this.setData({
      badges: mockBadges
    });

    this.calculateStats();
    this.filterBadges();
    this.loadRecentBadges();
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