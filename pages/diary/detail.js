// 小六日记详情页面 - AI智能评价功能
Page({
  data: {
    diaryId: '',
    diaryData: {},
    relatedDiaries: [],
    showShareModal: false,
    generatingComment: false,
    aiLiked: false,
    
    // 心情和天气映射
    moodMap: {
      happy: { emoji: '😊', name: '开心' },
      sad: { emoji: '😢', name: '难过' },
      excited: { emoji: '🤩', name: '兴奋' },
      calm: { emoji: '😌', name: '平静' },
      angry: { emoji: '😠', name: '生气' },
      surprised: { emoji: '😲', name: '惊讶' },
      tired: { emoji: '😴', name: '疲惫' },
      grateful: { emoji: '🙏', name: '感恩' }
    },
    
    weatherMap: {
      sunny: { emoji: '☀️', name: '晴天' },
      cloudy: { emoji: '☁️', name: '多云' },
      rainy: { emoji: '🌧️', name: '雨天' },
      snowy: { emoji: '❄️', name: '雪天' },
      windy: { emoji: '💨', name: '大风' },
      foggy: { emoji: '🌫️', name: '雾天' }
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ diaryId: options.id });
      this.loadDiaryDetail();
      this.loadRelatedDiaries();
    }
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.diaryId) {
      this.loadDiaryDetail();
    }
  },

  // 加载日记详情
  loadDiaryDetail() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const diary = diaries.find(item => item.id === this.data.diaryId);
      
      if (diary) {
        // 格式化日记数据
        const formattedDiary = this.formatDiaryData(diary);
        this.setData({ 
          diaryData: formattedDiary,
          aiLiked: diary.aiLiked || false
        });
        
        // 增加查看次数
        this.incrementViewCount(diary);
      } else {
        wx.showToast({
          title: '日记不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载日记详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化日记数据
  formatDiaryData(diary) {
    const date = new Date(diary.date);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    return {
      ...diary,
      dateDisplay: this.formatDate(date),
      weekDay: weekDays[date.getDay()],
      createTime: this.formatTime(diary.createTime || diary.date),
      wordCount: diary.content ? diary.content.length : 0,
      moodEmoji: diary.mood ? this.data.moodMap[diary.mood]?.emoji : '',
      moodName: diary.mood ? this.data.moodMap[diary.mood]?.name : '',
      weatherEmoji: diary.weather ? this.data.weatherMap[diary.weather]?.emoji : '',
      weatherName: diary.weather ? this.data.weatherMap[diary.weather]?.name : '',
      viewCount: diary.viewCount || 1
    };
  },

  // 格式化日期
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 增加查看次数
  incrementViewCount(diary) {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const index = diaries.findIndex(item => item.id === diary.id);
      
      if (index !== -1) {
        diaries[index].viewCount = (diaries[index].viewCount || 0) + 1;
        wx.setStorageSync('diaries', diaries);
      }
    } catch (error) {
      console.error('更新查看次数失败:', error);
    }
  },

  // 加载相关日记
  loadRelatedDiaries() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const currentDiary = diaries.find(item => item.id === this.data.diaryId);
      
      if (!currentDiary) return;
      
      // 筛选相关日记（相同心情或标签）
      const related = diaries
        .filter(diary => {
          if (diary.id === this.data.diaryId) return false;
          
          // 相同心情
          if (diary.mood === currentDiary.mood) return true;
          
          // 相同标签
          if (currentDiary.tags && diary.tags) {
            const hasCommonTag = currentDiary.tags.some(tag => 
              diary.tags.includes(tag)
            );
            if (hasCommonTag) return true;
          }
          
          return false;
        })
        .slice(0, 5)
        .map(diary => ({
          ...diary,
          dateDisplay: this.formatDate(new Date(diary.date)),
          preview: diary.content.substring(0, 30) + (diary.content.length > 30 ? '...' : ''),
          moodEmoji: diary.mood ? this.data.moodMap[diary.mood]?.emoji : '',
          moodName: diary.mood ? this.data.moodMap[diary.mood]?.name : ''
        }));
      
      this.setData({ relatedDiaries: related });
    } catch (error) {
      console.error('加载相关日记失败:', error);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 编辑日记
  editDiary() {
    wx.navigateTo({
      url: `/pages/diary/write?id=${this.data.diaryId}`
    });
  },

  // 分享日记
  shareDiary() {
    this.setData({ showShareModal: true });
  },

  // 关闭分享弹窗
  closeShareModal() {
    this.setData({ showShareModal: false });
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.diaryData.images || [];
    const urls = images.map(img => img.url || img);
    
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 生成AI评价
  generateAiComment() {
    if (this.data.generatingComment) return;
    
    this.setData({ generatingComment: true });
    
    // 模拟AI生成评价
    setTimeout(() => {
      const aiComments = [
        '今天的日记写得真棒！从你的文字中能感受到满满的正能量，继续保持这份美好的心情吧！✨',
        '看到你今天的记录，感觉你又成长了一点点呢！每一天的小进步都值得被记录和庆祝！🌟',
        '你的文字里藏着很多小美好，这些平凡却珍贵的时光，就是生活最真实的样子！💕',
        '今天的你很棒哦！能够用心记录生活的点点滴滴，这本身就是一件很了不起的事情！🎉',
        '从你的日记中能感受到你对生活的热爱，这种积极的态度会让每一天都变得更加精彩！🌈'
      ];
      
      const randomComment = aiComments[Math.floor(Math.random() * aiComments.length)];
      const currentTime = new Date();
      
      // 更新日记数据
      const updatedDiary = {
        ...this.data.diaryData,
        aiComment: {
          text: randomComment,
          time: this.formatTime(currentTime.getTime()),
          timestamp: currentTime.getTime()
        }
      };
      
      // 保存到本地存储
      this.saveAiComment(updatedDiary.aiComment);
      
      this.setData({
        diaryData: updatedDiary,
        generatingComment: false
      });
      
      wx.showToast({
        title: 'AI评价生成成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 保存AI评价到本地存储
  saveAiComment(aiComment) {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const index = diaries.findIndex(item => item.id === this.data.diaryId);
      
      if (index !== -1) {
        diaries[index].aiComment = aiComment;
        wx.setStorageSync('diaries', diaries);
      }
    } catch (error) {
      console.error('保存AI评价失败:', error);
    }
  },

  // 点赞AI评价
  toggleAiLike() {
    const newLikeStatus = !this.data.aiLiked;
    this.setData({ aiLiked: newLikeStatus });
    
    // 保存点赞状态
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const index = diaries.findIndex(item => item.id === this.data.diaryId);
      
      if (index !== -1) {
        diaries[index].aiLiked = newLikeStatus;
        wx.setStorageSync('diaries', diaries);
      }
    } catch (error) {
      console.error('保存点赞状态失败:', error);
    }
    
    if (newLikeStatus) {
      wx.showToast({
        title: '已点赞',
        icon: 'success'
      });
    }
  },

  // 重新生成AI评价
  regenerateAiComment() {
    wx.showModal({
      title: '重新生成',
      content: '确定要重新生成AI评价吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除当前评价
          const updatedDiary = { ...this.data.diaryData };
          delete updatedDiary.aiComment;
          
          this.setData({ 
            diaryData: updatedDiary,
            aiLiked: false
          });
          
          // 重新生成
          this.generateAiComment();
        }
      }
    });
  },

  // 查看相关日记
  viewRelatedDiary(e) {
    const { id } = e.currentTarget.dataset;
    wx.redirectTo({
      url: `/pages/diary/detail?id=${id}`
    });
  },

  // 上一篇日记
  goToPrevDiary() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const currentIndex = diaries.findIndex(item => item.id === this.data.diaryId);
      
      if (currentIndex > 0) {
        const prevDiary = diaries[currentIndex - 1];
        wx.redirectTo({
          url: `/pages/diary/detail?id=${prevDiary.id}`
        });
      } else {
        wx.showToast({
          title: '已经是第一篇了',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('跳转上一篇失败:', error);
    }
  },

  // 下一篇日记
  goToNextDiary() {
    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const currentIndex = diaries.findIndex(item => item.id === this.data.diaryId);
      
      if (currentIndex < diaries.length - 1) {
        const nextDiary = diaries[currentIndex + 1];
        wx.redirectTo({
          url: `/pages/diary/detail?id=${nextDiary.id}`
        });
      } else {
        wx.showToast({
          title: '已经是最后一篇了',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('跳转下一篇失败:', error);
    }
  },

  // 返回日记列表
  goToList() {
    wx.navigateTo({
      url: '/pages/diary/list'
    });
  },

  // 分享给朋友
  shareToFriend() {
    this.closeShareModal();
    
    // 构建分享内容
    const shareContent = `【小六日记】\n${this.data.diaryData.dateDisplay} ${this.data.diaryData.weekDay}\n\n${this.data.diaryData.content}`;
    
    wx.setClipboardData({
      data: shareContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
      }
    });
  },

  // 生成分享图片
  generateShareImage() {
    this.closeShareModal();
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 复制日记内容
  copyDiaryContent() {
    this.closeShareModal();
    
    wx.setClipboardData({
      data: this.data.diaryData.content,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
      }
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `我的日记 - ${this.data.diaryData.dateDisplay}`,
      path: `/pages/diary/detail?id=${this.data.diaryId}`,
      imageUrl: this.data.diaryData.images && this.data.diaryData.images.length > 0 
        ? (this.data.diaryData.images[0].url || this.data.diaryData.images[0])
        : ''
    };
  },

  // 页面分享到朋友圈
  onShareTimeline() {
    return {
      title: `小六日记 - ${this.data.diaryData.dateDisplay}`,
      query: `id=${this.data.diaryId}`,
      imageUrl: this.data.diaryData.images && this.data.diaryData.images.length > 0 
        ? (this.data.diaryData.images[0].url || this.data.diaryData.images[0])
        : ''
    };
  }
});