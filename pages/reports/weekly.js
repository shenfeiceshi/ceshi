// 周报页面
Page({
  data: {
    loading: false,
    showShareModal: false,
    currentWeek: 0, // 当前周偏移量，0表示本周，-1表示上周，1表示下周
    weekRange: '',
    weekNumber: 0,
    weekData: {
      diaryCount: 0,
      taskCount: 0,
      pointsEarned: 0,
      badgeCount: 0,
      completedTasks: 0,
      totalTasks: 0,
      pointsSpent: 0,
      pointsNet: 0,
      completionRate: 0,
      streakDays: 0
    },
    taskProgress: 0,
    moodStats: [],
    taskCategories: [],
    weekHighlights: [],
    weekDiaries: [],
    growthSuggestions: [],
    nextWeekGoals: []
  },

  onLoad(options) {
    this.initWeekData();
    this.loadWeekReport();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadWeekReport();
  },

  // 初始化周数据
  initWeekData() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (this.data.currentWeek * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekRange = `${this.formatDate(startOfWeek, 'MM/dd')} - ${this.formatDate(endOfWeek, 'MM/dd')}`;
    const weekNumber = this.getWeekNumber(startOfWeek);

    this.setData({
      weekRange,
      weekNumber
    });
  },

  // 加载周报数据
  async loadWeekReport() {
    this.setData({ loading: true });

    try {
      // 获取真实数据
      await this.getWeekData();
      const moodStats = await this.getMoodStats();
      const taskCategories = await this.getTaskCategories();
      const weekHighlights = await this.getWeekHighlights();
      const weekDiaries = await this.getWeekDiaries();
      const growthSuggestions = await this.getGrowthSuggestions();
      const nextWeekGoals = await this.getNextWeekGoals();

      const taskProgress = this.data.weekData.totalTasks > 0 
        ? Math.round((this.data.weekData.completedTasks / this.data.weekData.totalTasks) * 100) 
        : 0;

      this.setData({
        taskProgress: taskProgress,
        moodStats: moodStats,
        taskCategories: taskCategories,
        weekHighlights: weekHighlights,
        weekDiaries: weekDiaries,
        growthSuggestions: growthSuggestions,
        nextWeekGoals: nextWeekGoals,
        loading: false
      });

      // 绘制图表
      setTimeout(() => {
        this.drawMoodChart();
        this.drawPointsChart();
      }, 100);

    } catch (error) {
      console.error('加载周报数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 获取本周日期范围
  getWeekDateRange() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (this.data.currentWeek * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  },

  // 获取本周数据统计
  async getWeekData() {
    try {
      const { startOfWeek, endOfWeek } = this.getWeekDateRange();
      
      // 使用云函数获取周报数据
      const result = await wx.cloud.callFunction({
        name: 'getWeeklyReport',
        data: {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString()
        }
      });
      
      if (result.result && result.result.success) {
        const weekData = result.result.data;
        this.setData({
          weekData: {
            diaryCount: weekData.diaryCount || 0,
            taskCount: weekData.taskCount || 0,
            pointsEarned: weekData.pointsEarned || 0,
            badgeCount: weekData.badgeCount || 0,
            completedTasks: weekData.completedTasks || 0,
            totalTasks: weekData.totalTasks || 0,
            pointsSpent: weekData.pointsSpent || 0,
            pointsNet: weekData.pointsNet || 0,
            completionRate: weekData.completionRate || 0,
            streakDays: weekData.streakDays || 0
          }
        });
      } else {
        // 显示空状态
        this.setData({
          weekData: {
            diaryCount: 0,
            taskCount: 0,
            pointsEarned: 0,
            badgeCount: 0,
            completedTasks: 0,
            totalTasks: 0,
            pointsSpent: 0,
            pointsNet: 0,
            completionRate: 0,
            streakDays: 0
          }
        });
      }
    } catch (error) {
      console.error('获取周报数据失败:', error);
      // 显示空状态
      this.setData({
        weekData: {
          diaryCount: 0,
          taskCount: 0,
          pointsEarned: 0,
          badgeCount: 0,
          completedTasks: 0,
          totalTasks: 0,
          pointsSpent: 0,
          pointsNet: 0,
          completionRate: 0,
          streakDays: 0
        }
      });
    }
  },

  // 获取本周任务统计
  getWeekTaskStats(startOfWeek, endOfWeek) {
    const userTasks = wx.getStorageSync('userTasks') || [];
    let completedTasks = 0;
    let totalTasks = 0;

    // 遍历本周每一天
    for (let date = new Date(startOfWeek); date <= endOfWeek; date.setDate(date.getDate() + 1)) {
      const dateKey = this.formatDateKey(date);
      const dayTaskStatus = wx.getStorageSync(`tasks_${dateKey}`) || {};
      
      // 统计当天的任务完成情况
      userTasks.forEach(task => {
        totalTasks++;
        if (dayTaskStatus[task.id]) {
          completedTasks++;
        }
      });
    }

    return { completedTasks, totalTasks };
  },

  // 获取本周积分统计
  getWeekPointsStats(startOfWeek, endOfWeek) {
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    let pointsEarned = 0;
    let pointsSpent = 0;

    pointsRecords.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= startOfWeek && recordDate <= endOfWeek) {
        if (record.type === 'earn') {
          pointsEarned += record.amount;
        } else {
          pointsSpent += record.amount;
        }
      }
    });

    return { pointsEarned, pointsSpent };
  },

  // 计算连续天数
  calculateStreakDays() {
    const diaries = wx.getStorageSync('diaries') || [];
    if (diaries.length === 0) return 0;
    
    // 按日期排序
    const sortedDiaries = diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDiaries.length; i++) {
      const diaryDate = new Date(sortedDiaries[i].date);
      diaryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (diaryDate.getTime() === expectedDate.getTime()) {
        streakDays++;
      } else {
        break;
      }
    }
    
    return streakDays;
  },

  // 获取心情统计 - 从本周日记中统计
  async getMoodStats() {
    const { startOfWeek, endOfWeek } = this.getWeekDateRange();
    const diaries = wx.getStorageSync('diaries') || [];
    
    const weekDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfWeek && diaryDate <= endOfWeek && diary.mood;
    });

    const moodCount = {};
    weekDiaries.forEach(diary => {
      moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1;
    });

    const moodMap = {
      happy: { name: '开心', color: '#FFD93D' },
      excited: { name: '兴奋', color: '#FF6B6B' },
      calm: { name: '平静', color: '#4ECDC4' },
      sad: { name: '难过', color: '#95A5A6' },
      angry: { name: '生气', color: '#E74C3C' },
      surprised: { name: '惊讶', color: '#9B59B6' }
    };

    return Object.keys(moodCount).map(mood => ({
      mood,
      name: moodMap[mood]?.name || mood,
      count: moodCount[mood],
      color: moodMap[mood]?.color || '#BDC3C7'
    }));
  },

  // 获取任务分类统计 - 从真实任务数据统计
  async getTaskCategories() {
    const { startOfWeek, endOfWeek } = this.getWeekDateRange();
    const userTasks = wx.getStorageSync('userTasks') || [];
    
    const categoryStats = {};
    
    // 遍历本周每一天
    for (let date = new Date(startOfWeek); date <= endOfWeek; date.setDate(date.getDate() + 1)) {
      const dateKey = this.formatDateKey(date);
      const dayTaskStatus = wx.getStorageSync(`tasks_${dateKey}`) || {};
      
      userTasks.forEach(task => {
        const category = task.category || '其他';
        if (!categoryStats[category]) {
          categoryStats[category] = { completed: 0, total: 0 };
        }
        categoryStats[category].total++;
        if (dayTaskStatus[task.id]) {
          categoryStats[category].completed++;
        }
      });
    }

    const categoryColors = {
      '学习成长': '#3498DB',
      '健康运动': '#2ECC71',
      '生活习惯': '#F39C12',
      '个人卫生': '#9B59B6',
      '其他': '#95A5A6'
    };

    return Object.keys(categoryStats).map(category => ({
      name: category,
      completed: categoryStats[category].completed,
      total: categoryStats[category].total,
      progress: categoryStats[category].total > 0 
        ? Math.round((categoryStats[category].completed / categoryStats[category].total) * 100) 
        : 0,
      color: categoryColors[category] || '#BDC3C7'
    }));
  },

  // 获取本周亮点 - 从真实数据生成
  async getWeekHighlights() {
    const { startOfWeek, endOfWeek } = this.getWeekDateRange();
    const highlights = [];

    // 获取本周数据
    const diaries = wx.getStorageSync('diaries') || [];
    const weekDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfWeek && diaryDate <= endOfWeek;
    });

    const { completedTasks, totalTasks } = this.getWeekTaskStats(startOfWeek, endOfWeek);
    const { pointsEarned } = this.getWeekPointsStats(startOfWeek, endOfWeek);
    const streakDays = this.calculateStreakDays();

    // 检查连续打卡成就
    if (streakDays >= 7) {
      highlights.push({
        id: 1,
        icon: '🏆',
        title: `连续打卡${streakDays}天`,
        description: '坚持不懈，已经养成了良好的习惯！',
        date: this.formatDate(new Date())
      });
    } else if (streakDays >= 3) {
      highlights.push({
        id: 1,
        icon: '🔥',
        title: `连续打卡${streakDays}天`,
        description: '坚持每天记录，正在养成好习惯',
        date: this.formatDate(new Date())
      });
    }

    // 检查任务完成成就
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (completionRate >= 80 && totalTasks >= 5) {
      highlights.push({
        id: 2,
        icon: '⭐',
        title: `任务完成率${Math.round(completionRate)}%`,
        description: `本周完成了${completedTasks}个任务，执行力超强！`,
        date: this.formatDate(new Date())
      });
    } else if (completedTasks >= 3) {
      highlights.push({
        id: 2,
        icon: '✅',
        title: `完成${completedTasks}个任务`,
        description: '每个完成的任务都是进步的见证',
        date: this.formatDate(new Date())
      });
    }

    // 检查积分里程碑
    if (pointsEarned >= 100) {
      highlights.push({
        id: 3,
        icon: '💎',
        title: `获得${pointsEarned}积分`,
        description: '积分破百，成长路上的重要里程碑！',
        date: this.formatDate(new Date())
      });
    } else if (pointsEarned >= 50) {
      highlights.push({
        id: 3,
        icon: '💰',
        title: `获得${pointsEarned}积分`,
        description: '通过努力获得了丰厚的积分奖励',
        date: this.formatDate(new Date())
      });
    } else if (pointsEarned > 0) {
      highlights.push({
        id: 3,
        icon: '🪙',
        title: `获得${pointsEarned}积分`,
        description: '每一分积分都是努力的回报',
        date: this.formatDate(new Date())
      });
    }

    // 检查日记写作成就
    if (weekDiaries.length >= 5) {
      highlights.push({
        id: 4,
        icon: '📚',
        title: `写了${weekDiaries.length}篇日记`,
        description: '勤于记录，生活的每一天都很精彩！',
        date: this.formatDate(new Date())
      });
    } else if (weekDiaries.length >= 3) {
      highlights.push({
        id: 4,
        icon: '📝',
        title: `写了${weekDiaries.length}篇日记`,
        description: '记录生活点滴，留下美好回忆',
        date: this.formatDate(new Date())
      });
    }

    // 检查特殊表现 - 长篇日记
    const longDiaries = weekDiaries.filter(diary => diary.content && diary.content.length > 200);
    if (longDiaries.length > 0) {
      highlights.push({
        id: 5,
        icon: '✍️',
        title: '深度思考记录',
        description: `写了${longDiaries.length}篇深度日记，善于思考和总结`,
        date: this.formatDate(new Date())
      });
    }

    // 检查心情记录
    const moodDiaries = weekDiaries.filter(diary => diary.mood);
    if (moodDiaries.length >= 3) {
      highlights.push({
        id: 6,
        icon: '😊',
        title: '情绪管理达人',
        description: `记录了${moodDiaries.length}次心情变化，善于自我觉察`,
        date: this.formatDate(new Date())
      });
    }

    // 检查是否为新账号（没有任何数据）
    const allDiaries = wx.getStorageSync('diaries') || [];
    const allUserTasks = wx.getStorageSync('userTasks') || [];
    const allPointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 如果是新账号，返回空数组
    if (allDiaries.length === 0 && allUserTasks.length === 0 && allPointsRecords.length === 0 && currentPoints === 0) {
      return [];
    }

    // 如果没有突出表现，显示鼓励性内容
    if (highlights.length === 0) {
      highlights.push({
        id: 1,
        icon: '🌟',
        title: '开始你的成长之旅',
        description: '每一天都是新的开始，加油！',
        date: this.formatDate(new Date())
      });
    }

    // 最多显示3个亮点
    return highlights.slice(0, 3);
  },

  // 获取本周日记 - 从真实数据获取精选日记
  async getWeekDiaries() {
    const { startOfWeek, endOfWeek } = this.getWeekDateRange();
    const diaries = wx.getStorageSync('diaries') || [];
    
    const weekDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfWeek && diaryDate <= endOfWeek;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 如果没有日记，返回空状态提示
    if (weekDiaries.length === 0) {
      return [{
        id: 'empty',
        dateDisplay: '--',
        moodIcon: '',
        moodName: '',
        preview: '暂无精选日记',
        wordCount: 0,
        images: [],
        isEmpty: true
      }];
    }

    // 日记质量评分函数
    const calculateQualityScore = (diary) => {
      let score = 0;
      
      // 内容长度评分 (0-40分)
      if (diary.content) {
        const contentLength = diary.content.length;
        if (contentLength >= 200) score += 40;
        else if (contentLength >= 100) score += 30;
        else if (contentLength >= 50) score += 20;
        else score += 10;
      }
      
      // 是否有心情记录 (0-20分)
      if (diary.mood) score += 20;
      
      // 是否有图片 (0-20分)
      if (diary.images && diary.images.length > 0) score += 20;
      
      // 是否有标签 (0-10分)
      if (diary.tags && diary.tags.length > 0) score += 10;
      
      // 内容质量评估 (0-10分)
      if (diary.content) {
        // 检查是否包含思考性词汇
        const thoughtfulWords = ['思考', '反思', '总结', '感悟', '收获', '成长', '学习', '进步', '目标', '计划'];
        const hasThoughtfulContent = thoughtfulWords.some(word => diary.content.includes(word));
        if (hasThoughtfulContent) score += 10;
      }
      
      return score;
    };

    // 按质量评分排序，选择最优质的日记
    const qualityDiaries = weekDiaries
      .map(diary => ({
        ...diary,
        qualityScore: calculateQualityScore(diary)
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);

    // 筛选出高质量日记（评分>=50分）
    const selectedDiaries = qualityDiaries.filter(diary => diary.qualityScore >= 50);

    // 如果没有高质量日记，选择评分最高的1-2篇
    const finalDiaries = selectedDiaries.length > 0 
      ? selectedDiaries.slice(0, 3) 
      : qualityDiaries.slice(0, Math.min(2, qualityDiaries.length));

    // 如果所有日记质量都很低（最高分<30），显示暂无精选
    if (finalDiaries.length > 0 && finalDiaries[0].qualityScore < 30) {
      return [{
        id: 'empty',
        dateDisplay: '--',
        moodIcon: '',
        moodName: '',
        preview: '暂无精选日记，继续努力记录生活吧！',
        wordCount: 0,
        images: [],
        isEmpty: true
      }];
    }

    const moodMap = {
      happy: { emoji: '😊', name: '开心' },
      sad: { emoji: '😢', name: '难过' },
      excited: { emoji: '🤩', name: '兴奋' },
      calm: { emoji: '😌', name: '平静' },
      angry: { emoji: '😠', name: '生气' },
      surprised: { emoji: '😲', name: '惊讶' }
    };

    return finalDiaries.map(diary => {
      const date = new Date(diary.date);
      const moodInfo = moodMap[diary.mood] || { emoji: '', name: '' };
      
      return {
        id: diary.id,
        dateDisplay: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
        moodIcon: moodInfo.emoji,
        moodName: moodInfo.name,
        preview: diary.content ? (diary.content.length > 80 ? diary.content.substring(0, 80) + '...' : diary.content) : '',
        wordCount: diary.content ? diary.content.length : 0,
        images: diary.images || [],
        qualityScore: diary.qualityScore,
        isEmpty: false
      };
    });
  },

  // 获取成长建议 - 基于真实数据生成个性化建议
  async getGrowthSuggestions() {
    const suggestions = [];
    const { startOfWeek, endOfWeek } = this.getWeekDateRange();
    
    // 检查是否为新账号（没有任何数据）
    const allDiaries = wx.getStorageSync('diaries') || [];
    const allUserTasks = wx.getStorageSync('userTasks') || [];
    const allPointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 如果是新账号，返回空数组
    if (allDiaries.length === 0 && allUserTasks.length === 0 && allPointsRecords.length === 0 && currentPoints === 0) {
      return [];
    }
    
    // 获取本周数据
    const diaries = wx.getStorageSync('diaries') || [];
    const weekDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfWeek && diaryDate <= endOfWeek;
    });

    const { completedTasks, totalTasks } = this.getWeekTaskStats(startOfWeek, endOfWeek);
    const { pointsEarned } = this.getWeekPointsStats(startOfWeek, endOfWeek);
    const streakDays = this.calculateStreakDays();

    // 1. 日记频率分析和建议
    if (weekDiaries.length === 0) {
      suggestions.push('开始写日记吧！记录每天的生活点滴，让成长看得见');
    } else if (weekDiaries.length < 3) {
      suggestions.push('尝试增加日记频率，每周至少写3篇，养成记录的好习惯');
    } else if (weekDiaries.length >= 5) {
      suggestions.push('日记记录很棒！可以尝试在内容上更加深入，记录更多思考和感悟');
    } else {
      suggestions.push('日记记录频率不错，继续保持这个节奏');
    }

    // 2. 任务完成率分析和建议
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (totalTasks === 0) {
      suggestions.push('设置一些小目标开始行动吧！从简单的任务开始培养执行力');
    } else if (completionRate < 30) {
      suggestions.push('任务完成率较低，建议设置更容易达成的小目标，逐步建立信心');
    } else if (completionRate < 60) {
      suggestions.push('任务完成率有待提升，可以尝试将大任务分解成小步骤');
    } else if (completionRate < 80) {
      suggestions.push('任务完成得不错！可以适当增加一些挑战性的目标');
    } else {
      suggestions.push('任务执行力很强！可以尝试设置更遥远的目标规划');
    }

    // 3. 连续打卡分析和建议
    if (streakDays === 0) {
      suggestions.push('开始你的连续打卡挑战吧！坚持就是胜利');
    } else if (streakDays < 7) {
      suggestions.push(`已连续打卡${streakDays}天，继续坚持，目标一周连续打卡！`);
    } else if (streakDays < 30) {
      suggestions.push(`连续打卡${streakDays}天很棒！向30天连续打卡目标前进`);
    } else {
      suggestions.push(`${streakDays}天连续打卡，习惯已经养成！可以挑战更高的目标`);
    }

    // 4. 积分获得分析和建议
    if (pointsEarned === 0) {
      suggestions.push('通过完成任务和写日记来获得积分奖励吧！');
    } else if (pointsEarned < 50) {
      suggestions.push('积分获得不错，可以尝试完成更多任务来获得更多奖励');
    } else {
      suggestions.push('积分获得很丰富！可以考虑用积分兑换一些奖励犒赏自己');
    }

    // 5. 内容质量分析和建议
    const longDiaries = weekDiaries.filter(diary => diary.content && diary.content.length > 200);
    const moodDiaries = weekDiaries.filter(diary => diary.mood);
    const imageDiaries = weekDiaries.filter(diary => diary.images && diary.images.length > 0);

    if (weekDiaries.length > 0) {
      if (longDiaries.length === 0) {
        suggestions.push('尝试写更详细的日记，记录更多思考和感受');
      }
      
      if (moodDiaries.length < weekDiaries.length / 2) {
        suggestions.push('记录每天的心情变化，有助于更好地了解自己的情绪规律');
      }
      
      if (imageDiaries.length === 0 && weekDiaries.length >= 3) {
        suggestions.push('可以在日记中添加一些照片，让记录更加生动有趣');
      }
    }

    // 6. 基于数据的个性化建议
    if (weekDiaries.length > 0 && completedTasks > 0) {
      suggestions.push('记录和行动并重，你正在很好地平衡思考与实践');
    }

    if (streakDays >= 7 && completionRate >= 70) {
      suggestions.push('你的自律性很强！可以考虑制定更长远的成长计划');
    }

    // 7. 时间管理建议
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      suggestions.push('早上是制定计划的好时机，为新的一天设定目标吧！');
    } else if (currentHour < 18) {
      suggestions.push('下午适合回顾上午的进展，调整接下来的计划');
    } else {
      suggestions.push('晚上是反思总结的好时间，写写今天的收获和感悟');
    }

    // 如果没有生成足够的建议，添加通用建议
    if (suggestions.length < 3) {
      const generalSuggestions = [
        '每天进步一点点，积少成多就是大改变',
        '保持好奇心，多尝试新的事物和挑战',
        '定期回顾自己的成长历程，看看走过的路',
        '与朋友分享你的成长故事，互相鼓励',
        '设定明确的目标，并制定具体的行动计划'
      ];
      
      const remainingCount = 5 - suggestions.length;
      const randomSuggestions = generalSuggestions
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount);
      
      suggestions.push(...randomSuggestions);
    }

    // 返回最多5条建议
    return suggestions.slice(0, 5);
  },

  // 获取下周目标
  async getNextWeekGoals() {
    // 检查是否为新账号（没有任何数据）
    const allDiaries = wx.getStorageSync('diaries') || [];
    const allUserTasks = wx.getStorageSync('userTasks') || [];
    const allPointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 如果是新账号，返回空数组
    if (allDiaries.length === 0 && allUserTasks.length === 0 && allPointsRecords.length === 0 && currentPoints === 0) {
      return [];
    }
    
    return [
      { id: 1, text: '每天写一篇日记', points: 50, completed: false },
      { id: 2, text: '完成3次运动打卡', points: 30, completed: false },
      { id: 3, text: '阅读一本新书', points: 40, completed: false }
    ];
  },

  // 绘制心情图表
  drawMoodChart() {
    const ctx = wx.createCanvasContext('moodChart', this);
    const { moodStats } = this.data;
    
    if (!moodStats.length) return;

    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    let currentAngle = -Math.PI / 2;

    const total = moodStats.reduce((sum, item) => sum + item.count, 0);

    moodStats.forEach(item => {
      const angle = (item.count / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
      ctx.closePath();
      ctx.setFillStyle(item.color);
      ctx.fill();
      
      currentAngle += angle;
    });

    ctx.draw();
  },

  // 绘制积分趋势图表
  drawPointsChart() {
    const ctx = wx.createCanvasContext('pointsChart', this);
    
    // 获取本周每天的积分数据
    const { startOfWeek } = this.getWeekDateRange();
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    const pointsData = [];
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    // 计算每天的积分获得
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = this.formatDate(date);
      
      const dayPoints = pointsRecords
        .filter(record => record.date === dateStr && record.type === 'earn')
        .reduce((sum, record) => sum + record.amount, 0);
      
      pointsData.push(dayPoints);
    }
    
    const chartWidth = 300;
    const chartHeight = 150;
    const padding = 30;
    
    const maxPoints = Math.max(...pointsData, 10); // 至少为10，避免除零
    const stepX = (chartWidth - padding * 2) / (pointsData.length - 1);
    const stepY = (chartHeight - padding * 2) / maxPoints;

    // 绘制网格线
    ctx.setStrokeStyle('#E0E0E0');
    ctx.setLineWidth(1);
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight - padding * 2) * i / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(chartWidth - padding, y);
      ctx.stroke();
    }

    // 绘制折线
    ctx.setStrokeStyle('#667eea');
    ctx.setLineWidth(3);
    ctx.beginPath();
    
    pointsData.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = chartHeight - padding - point * stepY;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // 绘制数据点
    pointsData.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = chartHeight - padding - point * stepY;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.setFillStyle('#667eea');
      ctx.fill();
    });

    ctx.draw();
  },

  // 上一周
  prevWeek() {
    this.setData({
      currentWeek: this.data.currentWeek - 1
    });
    this.initWeekData();
    this.loadWeekReport();
  },

  // 下一周
  nextWeek() {
    if (this.data.currentWeek >= 0) {
      wx.showToast({
        title: '已是最新周报',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      currentWeek: this.data.currentWeek + 1
    });
    this.initWeekData();
    this.loadWeekReport();
  },

  // 查看日记
  viewDiary(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/diary/detail?id=${id}`
    });
  },

  // 切换目标状态
  toggleGoal(e) {
    const { id } = e.currentTarget.dataset;
    const goals = this.data.nextWeekGoals.map(goal => {
      if (goal.id === id) {
        return { ...goal, completed: !goal.completed };
      }
      return goal;
    });
    
    this.setData({
      nextWeekGoals: goals
    });
  },

  // 添加目标
  addGoal() {
    wx.showModal({
      title: '添加目标',
      editable: true,
      placeholderText: '请输入下周目标',
      success: (res) => {
        if (res.confirm && res.content) {
          const newGoal = {
            id: Date.now(),
            text: res.content,
            points: 20,
            completed: false
          };
          
          this.setData({
            nextWeekGoals: [...this.data.nextWeekGoals, newGoal]
          });
        }
      }
    });
  },

  // 分享周报
  shareReport() {
    this.setData({ showShareModal: true });
  },

  // 关闭分享弹窗
  closeShareModal() {
    this.setData({ showShareModal: false });
  },

  // 隐藏分享弹窗
  hideShareModal() {
    this.setData({ showShareModal: false });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡，用于分享弹窗内容区域
  },

  // 分享给朋友
  shareToFriend() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
    this.hideShareModal();
  },

  // 分享到朋友圈
  shareToMoments() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
    this.hideShareModal();
  },

  // 保存到相册
  saveToAlbum() {
    wx.showToast({
      title: '保存功能开发中',
      icon: 'none'
    });
    this.hideShareModal();
  },

  // 导出报告
  exportReport() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    });
  },

  // 查看月报
  viewMonthlyReport() {
    wx.navigateTo({
      url: '/pages/reports/monthly'
    });
  },

  // 下载周报
  downloadReport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 格式化日期键
  formatDateKey(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  },

  // 格式化日期显示
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 计算给定日期是一年中的第几周
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
});