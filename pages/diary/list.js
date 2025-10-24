// 小六日记列表页面 - 朋友圈风格
const app = getApp();

Page({
  data: {
    // 统计数据
    totalDiaries: 0,
    thisMonthDiaries: 0,
    continuousDays: 0,
    
    // 日记列表
    diaryList: [],
    
    // 分页相关
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    
    // 心情和天气映射
    moodMap: {
      happy: { emoji: '😊', text: '开心' },
      sad: { emoji: '😢', text: '难过' },
      excited: { emoji: '🤩', text: '兴奋' },
      calm: { emoji: '😌', text: '平静' },
      angry: { emoji: '😠', text: '生气' },
      surprised: { emoji: '😲', text: '惊讶' }
    },
    
    weatherMap: {
      sunny: { emoji: '☀️', text: '晴天' },
      cloudy: { emoji: '☁️', text: '多云' },
      rainy: { emoji: '🌧️', text: '雨天' },
      snowy: { emoji: '❄️', text: '雪天' },
      windy: { emoji: '💨', text: '大风' }
    }
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      // 未登录时显示默认数据
      this.setData({
        totalDiaries: 0,
        thisMonthDiaries: 0,
        continuousDays: 0,
        diaryList: []
      });
      return;
    }
    
    this.loadStats();
    this.loadDiaryList();
  },

  onShow() {
    // 从其他页面返回时刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadStats();
      this.loadDiaryList(true);
    } else {
      // 未登录时显示默认数据
      this.setData({
        totalDiaries: 0,
        thisMonthDiaries: 0,
        continuousDays: 0,
        diaryList: []
      });
    }
  },

  onPullDownRefresh() {
    this.loadStats();
    this.loadDiaryList(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const app = getApp();
      const token = app.globalData.token;
      
      if (!token) {
        // 未登录时使用默认数据
        this.setData({
          totalDiaries: 0,
          thisMonthDiaries: 0,
          continuousDays: 0
        });
        return;
      }
      
      const result = await wx.cloud.callFunction({
        name: 'getDiaries',
        data: {
          type: 'stats',
          token
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({
          totalDiaries: result.result.data.totalDiaries || 0,
          thisMonthDiaries: result.result.data.thisMonthDiaries || 0,
          continuousDays: result.result.data.continuousDays || 0
        });
      } else {
        // 云函数返回失败时使用默认数据
        this.setData({
          totalDiaries: 0,
          thisMonthDiaries: 0,
          continuousDays: 0
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 错误时使用默认数据
      this.setData({
        totalDiaries: 0,
        thisMonthDiaries: 0,
        continuousDays: 0
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载日记列表
  async loadDiaryList(refresh = false) {
    if (refresh) {
      this.setData({
        currentPage: 1,
        diaryList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const app = getApp();
      const token = app.globalData.token;
      
      if (!token) {
        // 未登录时显示空列表
        this.setData({
          diaryList: [],
          hasMore: false,
          loading: false
        });
        return;
      }
      
      const result = await wx.cloud.callFunction({
        name: 'getDiaries',
        data: {
          type: 'list',
          page: this.data.currentPage,
          pageSize: this.data.pageSize,
          token
        }
      });
      
      if (result.result && result.result.success) {
        const { diaries, hasMore } = result.result.data;
        
        // 格式化日记数据
        const formattedDiaries = diaries.map(diary => this.formatDiaryItem(diary));

        this.setData({
          diaryList: refresh ? formattedDiaries : [...this.data.diaryList, ...formattedDiaries],
          hasMore: hasMore,
          loading: false
        });
      } else {
        // 云函数返回失败时显示空列表
        this.setData({
          diaryList: [],
          hasMore: false,
          loading: false
        });
      }

    } catch (error) {
      console.error('加载日记列表失败:', error);
      // 错误时显示空列表
      this.setData({
        diaryList: [],
        hasMore: false,
        loading: false
      });
    }
  },

  // 格式化日记项数据
  formatDiaryItem(diary) {
    const date = new Date(diary.date);
    const createTime = diary.createTime ? new Date(diary.createTime) : date;
    
    // 格式化日期
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0') + '月';
    const year = date.getFullYear().toString();
    
    // 格式化创建时间
    const timeStr = this.formatTime(createTime);
    
    // 获取心情和天气信息
    const moodInfo = diary.mood ? this.data.moodMap[diary.mood] : null;
    const weatherInfo = diary.weather ? this.data.weatherMap[diary.weather] : null;
    
    // 处理AI评价预览
    let aiCommentPreview = '';
    if (diary.aiComment) {
      aiCommentPreview = diary.aiComment.length > 50 
        ? diary.aiComment.substring(0, 50) + '...' 
        : diary.aiComment;
    }
    
    return {
      id: diary._id || diary.id,
      day,
      month,
      year,
      content: diary.content,
      images: diary.images || [],
      tags: diary.tags || [],
      createTime: timeStr,
      
      // 心情信息
      mood: diary.mood,
      moodEmoji: moodInfo?.emoji || '',
      moodText: moodInfo?.text || '',
      
      // 天气信息
      weather: diary.weather,
      weatherEmoji: weatherInfo?.emoji || '',
      weatherText: weatherInfo?.text || '',
      
      // AI评价
      aiComment: diary.aiComment,
      aiCommentPreview
    };
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 加载更多
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      currentPage: this.data.currentPage + 1
    });
    
    this.loadDiaryList();
  },

  // 查看日记详情
  viewDiary(e) {
    const diaryId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/diary/detail?id=${diaryId}`
    });
  },

  // 编辑日记
  editDiary(e) {
    const diaryId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/diary/write?id=${diaryId}&mode=edit`
    });
  },

  // 删除日记
  async deleteDiary(e) {
    const diaryId = e.currentTarget.dataset.id;
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这篇日记吗？'
    });
    
    if (!res.confirm) return;
    
    try {
      wx.showLoading({ title: '删除中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'deleteDiary',
        data: {
          diaryId: diaryId
        }
      });
      
      if (result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 刷新列表
        this.loadStats();
        this.loadDiaryList(true);
      } else {
        throw new Error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除日记失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 分享日记
  shareDiary(e) {
    const diaryId = e.currentTarget.dataset.id;
    
    // 找到对应的日记
    const diary = this.data.diaryList.find(item => item.id === diaryId);
    if (!diary) return;
    
    wx.showActionSheet({
      itemList: ['分享给朋友', '生成图片', '复制内容'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.shareToFriend(diary);
            break;
          case 1:
            this.generateShareImage(diary);
            break;
          case 2:
            this.copyContent(diary);
            break;
        }
      }
    });
  },

  // 分享给朋友
  shareToFriend(diary) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 生成分享图片
  generateShareImage(diary) {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 复制内容
  copyContent(diary) {
    wx.setClipboardData({
      data: diary.content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 去写日记
  goToWrite() {
    wx.navigateTo({
      url: '/pages/diary/write'
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '小六日记 - 记录成长的每一天',
      path: '/pages/diary/list',
      imageUrl: '/images/share/diary-list.png'
    };
  },

  onShareTimeline() {
    return {
      title: '小六日记 - 记录成长的每一天',
      query: '',
      imageUrl: '/images/share/diary-list.png'
    };
  }
});