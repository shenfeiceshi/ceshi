// 月报页面
Page({
  data: {
    loading: false,
    year: 2024,
    month: 1,
    monthName: '一月',
    calendarWeeks: [],
    activityLevels: {},
    monthData: {
      diaryCount: 0,
      taskCount: 0,
      pointsEarned: 0,
      badgeCount: 0,
      completionRate: 0,
      streakDays: 0,
      totalPoints: 0,
      pointsSpent: 0
    },
    moodAnalysis: {
      dominant: '',
      distribution: [],
      trend: ''
    },
    growthTimeline: [],
    learningStats: {
      categories: [],
      totalHours: 0,
      completedCourses: 0
    },
    keywordCloud: [],
    monthlyRanking: {
      diaryRank: 0,
      pointsRank: 0,
      taskRank: 0
    },
    highlights: []
  },

  onLoad(options) {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      monthName: this.getMonthName(now.getMonth() + 1)
    });
    this.initMonthData();
  },

  onReady() {
    this.loadMonthReport();
  },

  // 初始化月度数据
  initMonthData() {
    this.generateCalendar();
  },

  // 加载月报数据
  async loadMonthReport() {
    this.setData({ loading: true });

    try {
      // 获取真实数据
      const monthData = await this.getMonthStats();
      const moodAnalysis = await this.getMoodAnalysis();
      const growthTimeline = await this.getGrowthTimeline();
      const learningStats = await this.getLearningStats();
      const keywordCloud = await this.getKeywordCloud();
      const monthlyRanking = await this.getMonthlyRanking();
      const highlights = await this.getMonthHighlights();

      this.setData({
        monthData,
        moodAnalysis,
        growthTimeline,
        learningStats,
        keywordCloud,
        monthlyRanking,
        highlights,
        loading: false
      });

      // 重新生成日历以显示活跃度
      this.generateCalendar();

    } catch (error) {
      console.error('加载月报数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.setData({ loading: false });
    }
  },

  // 获取月度日期范围
  getMonthDateRange() {
    const startOfMonth = new Date(this.data.year, this.data.month - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(this.data.year, this.data.month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return { startOfMonth, endOfMonth };
  },

  // 获取月度统计数据
  async getMonthStats() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    
    // 检查是否为新账号（没有任何数据）
    const allDiaries = wx.getStorageSync('diaries') || [];
    const allUserTasks = wx.getStorageSync('userTasks') || [];
    const allPointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 如果是新账号，返回空数据
    if (allDiaries.length === 0 && allUserTasks.length === 0 && allPointsRecords.length === 0 && currentPoints === 0) {
      return {
        diaryCount: 0,
        taskCount: 0,
        pointsEarned: 0,
        badgeCount: 0,
        completionRate: 0,
        streakDays: 0,
        totalPoints: 0,
        pointsSpent: 0
      };
    }
    
    // 获取本月日记数据
    const diaries = wx.getStorageSync('diaries') || [];
    const monthDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfMonth && diaryDate <= endOfMonth;
    });

    // 获取本月任务完成数据
    const { completedTasks, totalTasks } = this.getMonthTaskStats(startOfMonth, endOfMonth);

    // 获取本月积分变化
    const { pointsEarned, pointsSpent } = this.getMonthPointsStats(startOfMonth, endOfMonth);

    // 获取徽章数量
    const userInfo = wx.getStorageSync('userInfo') || {};
    const badgeCount = (userInfo.badges && userInfo.badges.length) || 0;

    // 计算连续天数
    const streakDays = this.calculateStreakDays();

    // 计算完成率
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      diaryCount: monthDiaries.length,
      taskCount: completedTasks,
      pointsEarned: pointsEarned,
      badgeCount: badgeCount,
      completionRate: completionRate,
      streakDays: streakDays,
      totalPoints: pointsEarned,
      pointsSpent: pointsSpent
    };
  },

  // 获取本月任务统计
  getMonthTaskStats(startOfMonth, endOfMonth) {
    const userTasks = wx.getStorageSync('userTasks') || [];
    let completedTasks = 0;
    let totalTasks = 0;

    // 遍历本月每一天
    for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
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

  // 获取本月积分统计
  getMonthPointsStats(startOfMonth, endOfMonth) {
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    let pointsEarned = 0;
    let pointsSpent = 0;

    pointsRecords.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
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

  // 获取心情分析
  async getMoodAnalysis() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    
    // 检查是否为新账号（没有任何数据）
    const allDiaries = wx.getStorageSync('diaries') || [];
    const allUserTasks = wx.getStorageSync('userTasks') || [];
    const allPointsRecords = wx.getStorageSync('pointsRecords') || [];
    const currentPoints = wx.getStorageSync('points') || 0;
    
    // 如果是新账号，返回空数据
    if (allDiaries.length === 0 && allUserTasks.length === 0 && allPointsRecords.length === 0 && currentPoints === 0) {
      return {
        dominant: '暂无数据',
        distribution: [],
        trend: '暂无数据'
      };
    }
    
    const diaries = wx.getStorageSync('diaries') || [];
    
    const monthDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfMonth && diaryDate <= endOfMonth && diary.mood;
    });

    const moodCount = {};
    monthDiaries.forEach(diary => {
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

    const distribution = Object.keys(moodCount).map(mood => ({
      mood,
      name: moodMap[mood]?.name || mood,
      count: moodCount[mood],
      percentage: monthDiaries.length > 0 ? Math.round((moodCount[mood] / monthDiaries.length) * 100) : 0,
      color: moodMap[mood]?.color || '#BDC3C7'
    })).sort((a, b) => b.count - a.count);

    const dominant = distribution.length > 0 ? distribution[0].name : '暂无数据';
    const trend = this.analyzeMoodTrend(monthDiaries);

    return {
      dominant,
      distribution,
      trend
    };
  },

  // 分析心情趋势
  analyzeMoodTrend(diaries) {
    if (diaries.length < 2) return '数据不足';
    
    const recentDiaries = diaries.slice(-7); // 最近7天
    const earlyDiaries = diaries.slice(0, 7); // 前7天
    
    const positiveScore = (diaries) => {
      return diaries.reduce((score, diary) => {
        if (diary.mood === 'happy' || diary.mood === 'excited') return score + 1;
        if (diary.mood === 'sad' || diary.mood === 'angry') return score - 1;
        return score;
      }, 0);
    };
    
    const recentScore = positiveScore(recentDiaries);
    const earlyScore = positiveScore(earlyDiaries);
    
    if (recentScore > earlyScore) return '情绪呈上升趋势';
    if (recentScore < earlyScore) return '情绪有所波动';
    return '情绪保持稳定';
  },

  // 获取成长轨迹
  async getGrowthTimeline() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const timeline = [];
    
    // 从日记中提取重要事件
    const diaries = wx.getStorageSync('diaries') || [];
    const monthDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfMonth && diaryDate <= endOfMonth;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 从积分记录中提取成就
    const pointsRecords = wx.getStorageSync('pointsRecords') || [];
    const monthPoints = pointsRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfMonth && recordDate <= endOfMonth && record.type === 'earn';
    });

    // 添加日记事件
    monthDiaries.forEach((diary, index) => {
      if (index % 3 === 0 || diary.content.length > 100) { // 每3篇或长日记
        timeline.push({
          date: diary.date,
          type: 'diary',
          title: '记录生活',
          description: diary.content.length > 50 ? diary.content.substring(0, 50) + '...' : diary.content,
          icon: '📝'
        });
      }
    });

    // 添加积分成就
    const pointsMilestones = [50, 100, 200, 500];
    let totalPoints = 0;
    monthPoints.forEach(record => {
      totalPoints += record.amount;
      const milestone = pointsMilestones.find(m => totalPoints >= m && (totalPoints - record.amount) < m);
      if (milestone) {
        timeline.push({
          date: record.date,
          type: 'achievement',
          title: `积分达到${milestone}`,
          description: record.description || '通过完成任务获得积分',
          icon: '🏆'
        });
      }
    });

    // 按日期排序
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    return timeline.length > 0 ? timeline.slice(0, 10) : [{
      date: this.formatDate(new Date()),
      type: 'start',
      title: '开始成长之旅',
      description: '记录每一个美好的瞬间',
      icon: '🌟'
    }];
  },

  // 获取学习统计
  async getLearningStats() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const userTasks = wx.getStorageSync('userTasks') || [];
    
    const categoryStats = {};
    let totalCompletedTasks = 0;
    
    // 遍历本月每一天
    for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
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
          totalCompletedTasks++;
        }
      });
    }

    const categories = Object.keys(categoryStats).map(category => ({
      name: category,
      completed: categoryStats[category].completed,
      total: categoryStats[category].total,
      progress: categoryStats[category].total > 0 
        ? Math.round((categoryStats[category].completed / categoryStats[category].total) * 100) 
        : 0
    }));

    return {
      categories,
      totalHours: Math.round(totalCompletedTasks * 0.5), // 假设每个任务0.5小时
      completedCourses: Math.floor(totalCompletedTasks / 10) // 每10个任务算一个课程
    };
  },

  // 获取关键词云
  async getKeywordCloud() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const diaries = wx.getStorageSync('diaries') || [];
    
    const monthDiaries = diaries.filter(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate >= startOfMonth && diaryDate <= endOfMonth && diary.content;
    });

    if (monthDiaries.length === 0) {
      return [
        { text: '开始', size: 20, color: '#3498DB' },
        { text: '记录', size: 18, color: '#2ECC71' },
        { text: '成长', size: 16, color: '#F39C12' }
      ];
    }

    // 简单的关键词提取（基于常见词汇）
    const keywords = {};
    const commonWords = ['学习', '工作', '运动', '阅读', '朋友', '家人', '开心', '努力', '进步', '挑战', '成功', '目标'];
    
    monthDiaries.forEach(diary => {
      commonWords.forEach(word => {
        if (diary.content.includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    const keywordArray = Object.keys(keywords).map(word => ({
      text: word,
      size: Math.min(20, 12 + keywords[word] * 2),
      color: this.getRandomColor()
    })).sort((a, b) => b.size - a.size);

    return keywordArray.length > 0 ? keywordArray.slice(0, 15) : [
      { text: '生活', size: 20, color: '#3498DB' },
      { text: '记录', size: 18, color: '#2ECC71' },
      { text: '成长', size: 16, color: '#F39C12' }
    ];
  },

  // 获取随机颜色
  getRandomColor() {
    const colors = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 获取月度排行
  async getMonthlyRanking() {
    // 由于是单用户应用，这里返回固定的排名
    const { monthData } = this.data;
    
    return {
      diaryRank: monthData.diaryCount > 10 ? 1 : monthData.diaryCount > 5 ? 2 : 3,
      pointsRank: monthData.pointsEarned > 200 ? 1 : monthData.pointsEarned > 100 ? 2 : 3,
      taskRank: monthData.completionRate > 80 ? 1 : monthData.completionRate > 60 ? 2 : 3
    };
  },

  // 获取精彩瞬间
  async getMonthHighlights() {
    const { startOfMonth, endOfMonth } = this.getMonthDateRange();
    const highlights = [];

    // 检查月度成就
    const monthData = this.data.monthData;
    
    if (monthData.diaryCount > 0) {
      highlights.push({
        id: 1,
        title: `写了${monthData.diaryCount}篇日记`,
        description: '记录生活的美好瞬间',
        image: '/images/highlights/diary.jpg',
        date: this.formatDate(new Date())
      });
    }

    if (monthData.pointsEarned > 0) {
      highlights.push({
        id: 2,
        title: `获得${monthData.pointsEarned}积分`,
        description: '通过努力完成各项任务',
        image: '/images/highlights/points.jpg',
        date: this.formatDate(new Date())
      });
    }

    if (monthData.completionRate > 50) {
      highlights.push({
        id: 3,
        title: `任务完成率${monthData.completionRate}%`,
        description: '坚持不懈，持续进步',
        image: '/images/highlights/tasks.jpg',
        date: this.formatDate(new Date())
      });
    }

    return highlights.length > 0 ? highlights : [{
      id: 1,
      title: '开始你的成长之旅',
      description: '每一天都是新的开始',
      image: '/images/highlights/start.jpg',
      date: this.formatDate(new Date())
    }];
  },

  // 生成日历
  generateCalendar() {
    const year = this.data.year;
    const month = this.data.month;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const weeks = [];
    let currentWeek = [];
    
    // 填充月初空白
    for (let i = 0; i < startWeekDay; i++) {
      currentWeek.push({ day: '', isEmpty: true, activity: 0 });
    }

    // 填充月份天数
    for (let day = 1; day <= daysInMonth; day++) {
      const activity = this.getActivityLevel(year, month, day);
      currentWeek.push({
        day: day,
        isEmpty: false,
        activity: activity,
        isToday: this.isToday(year, month, day)
      });

      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    // 填充月末空白
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push({ day: '', isEmpty: true, activity: 0 });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    this.setData({ calendarWeeks: weeks });
  },

  // 获取活跃度等级
  getActivityLevel(year, month, day) {
    const dateKey = `${year}-${month}-${day}`;
    const diaries = wx.getStorageSync('diaries') || [];
    const userTasks = wx.getStorageSync('userTasks') || [];
    const dayTaskStatus = wx.getStorageSync(`tasks_${dateKey}`) || {};

    // 检查当天是否有日记
    const hasDiary = diaries.some(diary => {
      const diaryDate = new Date(diary.date);
      return diaryDate.getFullYear() === year && 
             diaryDate.getMonth() + 1 === month && 
             diaryDate.getDate() === day;
    });

    // 检查当天任务完成情况
    const completedTasks = userTasks.filter(task => dayTaskStatus[task.id]).length;
    const totalTasks = userTasks.length;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // 计算活跃度等级 (0-4)
    let level = 0;
    if (hasDiary) level += 2;
    if (taskCompletionRate > 0.8) level += 2;
    else if (taskCompletionRate > 0.5) level += 1;

    return Math.min(level, 4);
  },

  // 检查是否是今天
  isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() + 1 === month && 
           today.getDate() === day;
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

  // 获取月份名称
  getMonthName(month) {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return monthNames[month - 1];
  },

  // 上个月
  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    
    this.setData({
      year,
      month,
      monthName: this.getMonthName(month)
    });
    
    this.initMonthData();
    this.loadMonthReport();
  },

  // 下个月
  nextMonth() {
    const now = new Date();
    let { year, month } = this.data;
    
    // 不能查看未来的月份
    if (year >= now.getFullYear() && month >= now.getMonth() + 1) {
      wx.showToast({
        title: '已是最新月报',
        icon: 'none'
      });
      return;
    }
    
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    
    this.setData({
      year,
      month,
      monthName: this.getMonthName(month)
    });
    
    this.initMonthData();
    this.loadMonthReport();
  },

  // 点击日历日期
  onCalendarDayTap(e) {
    const { day } = e.currentTarget.dataset;
    if (!day) return;
    
    const { year, month } = this.data;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 跳转到当天的日记或任务页面
    wx.showActionSheet({
      itemList: ['查看当天日记', '查看当天任务'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 查看日记
          wx.navigateTo({
            url: `/pages/diary/list?date=${dateStr}`
          });
        } else if (res.tapIndex === 1) {
          // 查看任务
          wx.navigateTo({
            url: `/pages/tasks/list?date=${dateStr}`
          });
        }
      }
    });
  },

  // 查看详细统计
  viewDetailStats() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 分享月报
  shareMonthReport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 导出月报
  exportMonthReport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});