// 小六日记列表页面 - 朋友圈风格
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
    this.loadStats();
    this.loadDiaryList();
  },

  onShow() {
    // 从其他页面返回时刷新数据
    this.loadStats();
    this.loadDiaryList(true);
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
  loadStats() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // 计算本月日记数量
      const thisMonthDiaries = diaries.filter(diary => {
        const diaryDate = new Date(diary.date);
        return diaryDate.getMonth() === currentMonth && 
               diaryDate.getFullYear() === currentYear;
      }).length;
      
      // 计算连续天数（简化版本）
      const continuousDays = this.calculateContinuousDays(diaries);
      
      this.setData({
        totalDiaries: diaries.length,
        thisMonthDiaries,
        continuousDays
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 计算连续写日记天数
  calculateContinuousDays(diaries) {
    if (diaries.length === 0) return 0;
    
    // 按日期排序
    const sortedDiaries = diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let continuousDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDiaries.length; i++) {
      const diaryDate = new Date(sortedDiaries[i].date);
      diaryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (diaryDate.getTime() === expectedDate.getTime()) {
        continuousDays++;
      } else {
        break;
      }
    }
    
    return continuousDays;
  },

  // 加载日记列表
  loadDiaryList(refresh = false) {
    if (refresh) {
      this.setData({
        currentPage: 1,
        diaryList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const allDiaries = wx.getStorageSync('diaries') || [];
      
      // 按创建时间倒序排列
      const sortedDiaries = allDiaries.sort((a, b) => 
        new Date(b.createTime || b.date) - new Date(a.createTime || a.date)
      );

      // 分页处理
      const startIndex = (this.data.currentPage - 1) * this.data.pageSize;
      const endIndex = startIndex + this.data.pageSize;
      const pageDiaries = sortedDiaries.slice(startIndex, endIndex);

      // 格式化日记数据
      const formattedDiaries = pageDiaries.map(diary => this.formatDiaryItem(diary));

      this.setData({
        diaryList: refresh ? formattedDiaries : [...this.data.diaryList, ...formattedDiaries],
        hasMore: endIndex < sortedDiaries.length,
        loading: false
      });

    } catch (error) {
      console.error('加载日记列表失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
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
      id: diary.id,
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