// 抽奖大厅页面
Page({
  data: {
    userPoints: 0, // 用户积分
    lotteryCost: 10, // 抽奖消耗积分
    isSpinning: false, // 是否正在抽奖
    showPrizeModal: false, // 是否显示中奖弹窗
    wonPrize: {}, // 中奖奖品信息
    isAdmin: true, // 是否为管理员（小学生用户都是管理员）
    prizes: [], // 奖品列表，从本地存储加载
    recentRecords: [] // 最近中奖记录，从本地存储动态加载
  },

  onLoad: function(options) {
    this.loadUserPoints();
    this.loadPrizeData();
    this.loadLotteryCost();
    this.loadRecentRecords();
  },

  onShow: function() {
    this.loadUserPoints();
    this.loadPrizeData();
    this.loadLotteryCost();
    this.loadRecentRecords();
  },

  // 加载用户积分
  loadUserPoints: function() {
    // 从本地存储获取用户积分（统一使用 'points' 键）
    const points = wx.getStorageSync('points') || 0;
    
    // 同时检查用户信息中的积分，确保数据同步
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (userInfo.points && userInfo.points !== points) {
      // 如果用户信息中的积分与存储中的积分不一致，以存储中的为准
      userInfo.points = points;
      wx.setStorageSync('userInfo', userInfo);
    }
    
    this.setData({
      userPoints: points
    });
  },

  // 加载奖品数据
  loadPrizeData: function() {
    const savedPrizes = wx.getStorageSync('prizeList');
    if (savedPrizes && savedPrizes.length > 0) {
      // 计算权重分配的概率
      const normalizedPrizes = this.normalizeProbabilities(savedPrizes);
      this.setData({
        prizes: normalizedPrizes
      }, () => {
        // 数据加载完成后初始化转盘
        this.initLotteryWheel();
      });
    } else {
      // 如果没有奖品数据，使用默认数据
      const defaultPrizes = [
        {
          id: 1,
          name: '小红花',
          emoji: '🌺',
          probability: 30,
          description: '获得一朵小红花奖励！'
        },
        {
          id: 2,
          name: '金币奖励',
          emoji: '💰',
          probability: 25,
          description: '获得额外10积分奖励！'
        },
        {
          id: 3,
          name: '学习徽章',
          emoji: '🏆',
          probability: 20,
          description: '获得学习小能手徽章！'
        },
        {
          id: 4,
          name: '彩虹贴纸',
          emoji: '🌈',
          probability: 15,
          description: '获得漂亮的彩虹贴纸！'
        },
        {
          id: 5,
          name: '神秘礼物',
          emoji: '🎁',
          probability: 8,
          description: '获得神秘大礼包！'
        },
        {
          id: 6,
          name: '超级奖励',
          emoji: '⭐',
          probability: 2,
          description: '获得超级大奖！'
        }
      ];
      
      // 保存默认数据到本地存储
      wx.setStorageSync('prizeList', defaultPrizes);
      
      const normalizedPrizes = this.normalizeProbabilities(defaultPrizes);
      this.setData({
        prizes: normalizedPrizes
      }, () => {
        this.initLotteryWheel();
      });
    }
  },

  // 加载抽奖消耗积分
  loadLotteryCost: function() {
    const cost = wx.getStorageSync('lotteryCost') || 10;
    this.setData({
      lotteryCost: cost
    });
  },

  // 加载最近中奖记录
  loadRecentRecords: function() {
    try {
      const allRecords = wx.getStorageSync('lotteryRecords') || [];
      
      // 筛选出中奖记录并按时间倒序排列
      const winRecords = allRecords
        .filter(record => record.prizeId && record.prizeName && record.prizeName !== '谢谢参与')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3); // 只取最近3条
      
      // 格式化记录数据
      const formattedRecords = winRecords.map(record => ({
        id: record.id,
        prizeEmoji: record.prizeEmoji || '🎁',
        prizeName: record.prizeName,
        timeAgo: this.formatTimeAgo(record.timestamp)
      }));
      
      this.setData({
        recentRecords: formattedRecords
      });
      
      console.log('加载最近中奖记录成功：', formattedRecords);
    } catch (error) {
      console.error('加载最近中奖记录失败：', error);
      this.setData({
        recentRecords: []
      });
    }
  },

  // 格式化时间为相对时间
  formatTimeAgo: function(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}分钟前`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}小时前`;
    } else if (diff < week) {
      const days = Math.floor(diff / day);
      return `${days}天前`;
    } else if (diff < month) {
      const weeks = Math.floor(diff / week);
      return `${weeks}周前`;
    } else {
      const months = Math.floor(diff / month);
      return `${months}个月前`;
    }
  },

  // 权重分配算法：处理概率超过100%的情况
  normalizeProbabilities: function(prizes) {
    if (!prizes || prizes.length === 0) return [];
    
    // 计算总概率
    const totalProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
    
    // 如果总概率为0，平均分配
    if (totalProbability === 0) {
      const averageProbability = 100 / prizes.length;
      return prizes.map(prize => ({
        ...prize,
        normalizedProbability: averageProbability
      }));
    }
    
    // 按权重重新计算概率，确保总和为100%
    return prizes.map(prize => ({
      ...prize,
      normalizedProbability: (prize.probability / totalProbability) * 100
    }));
  },

  // 初始化抽奖转盘
  initLotteryWheel: function() {
    const prizes = this.data.prizes;
    console.log('初始化转盘，奖品数据：', prizes);
    
    if (!prizes || prizes.length === 0) {
      console.log('没有奖品数据，无法绘制转盘');
      return;
    }

    // 延迟执行，确保canvas已经渲染
    setTimeout(() => {
      const ctx = wx.createCanvasContext('lotteryWheel', this);
      const centerX = 160;
      const centerY = 160;
      const radius = 120;
      const anglePerPrize = 360 / prizes.length;

      console.log(`开始绘制转盘，奖品数量：${prizes.length}，每个扇形角度：${anglePerPrize}`);

      // 绘制转盘背景
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setFillStyle('#ffffff');
      ctx.fill();

      // 绘制奖品扇形
      prizes.forEach((prize, index) => {
        const startAngle = (index * anglePerPrize - 90) * Math.PI / 180;
        const endAngle = ((index + 1) * anglePerPrize - 90) * Math.PI / 180;
        
        console.log(`绘制奖品 ${index + 1}: ${prize.name}，角度：${startAngle} - ${endAngle}`);
        
        // 扇形背景色
        const colors = ['#FF6B35', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8E8E', '#A8E6CF', '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C'];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.setFillStyle(colors[index % colors.length]);
        ctx.fill();

        // 绘制分割线
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(startAngle),
          centerY + radius * Math.sin(startAngle)
        );
        ctx.setStrokeStyle('#ffffff');
        ctx.setLineWidth(2);
        ctx.stroke();

        // 绘制奖品emoji和文字
        const textAngle = startAngle + (endAngle - startAngle) / 2;
        const emojiX = centerX + (radius * 0.6) * Math.cos(textAngle);
        const emojiY = centerY + (radius * 0.6) * Math.sin(textAngle);
        const textX = centerX + (radius * 0.8) * Math.cos(textAngle);
        const textY = centerY + (radius * 0.8) * Math.sin(textAngle);
        
        // 绘制emoji
        ctx.save();
        ctx.translate(emojiX, emojiY);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.setFillStyle('#ffffff');
        ctx.setFontSize(24);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(prize.emoji || '🎁', 0, 0);
        ctx.restore();
        
        // 绘制奖品名称
        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.setFillStyle('#ffffff');
        ctx.setFontSize(12);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(prize.name || '奖品', 0, 0);
        ctx.restore();
      });

      // 强制绘制
      ctx.draw(true);
      console.log('转盘绘制完成');
    }, 100);
  },

  // 开始抽奖
  startLottery: async function() {
    console.log('开始抽奖，当前奖品数据：', this.data.prizes);
    
    if (this.data.isSpinning) return;
    
    // 检查是否有奖品数据
    if (!this.data.prizes || this.data.prizes.length === 0) {
      wx.showToast({
        title: '暂无奖品，请先设置奖品',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.userPoints < this.data.lotteryCost) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isSpinning: true
    });

    // 扣除积分 - 调用云托管API
    try {
      const result = await getApp().callCloudAPI('/api/points/deduct', {
        amount: this.data.lotteryCost,
        source: '抽奖消费',
        description: `抽奖消耗${this.data.lotteryCost}积分`
      });

      if (result && result.success) {
        // 统一更新所有积分相关存储
        this.updateAllPointsStorage(result.newBalance);
      } else {
        throw new Error('积分扣除失败');
      }
    } catch (error) {
      console.error('扣除积分失败:', error);
      // 如果云托管API失败，使用本地存储作为备用
      const newPoints = this.data.userPoints - this.data.lotteryCost;
      
      // 统一更新所有积分相关存储
      this.updateAllPointsStorage(newPoints);
    }

    // 模拟抽奖结果，使用权重分配后的概率
    const randomNum = Math.random() * 100;
    let cumulativeProbability = 0;
    let wonPrize = null;

    console.log('随机数：', randomNum);

    for (let prize of this.data.prizes) {
      const probability = prize.normalizedProbability || prize.probability || 0;
      cumulativeProbability += probability;
      console.log(`奖品 ${prize.name}，概率：${probability}，累积概率：${cumulativeProbability}`);
      
      if (randomNum <= cumulativeProbability) {
        wonPrize = prize;
        break;
      }
    }

    // 如果没有抽中任何奖品（理论上不应该发生），选择第一个奖品
    if (!wonPrize && this.data.prizes.length > 0) {
      wonPrize = this.data.prizes[0];
      console.log('未抽中任何奖品，使用默认奖品：', wonPrize);
    }

    console.log('最终中奖奖品：', wonPrize);

    // 转盘旋转动画
    this.spinWheel(wonPrize);
  },

  // 转盘旋转动画
  spinWheel: function(wonPrize) {
    console.log('开始转盘动画，中奖奖品：', wonPrize);
    
    if (!wonPrize) {
      console.error('wonPrize 为空，无法执行转盘动画');
      this.setData({ isSpinning: false });
      return;
    }

    // 设置旋转状态，通过数据绑定触发CSS动画
    this.setData({
      isSpinning: true
    });

    // 2秒后停止动画并显示结果
    setTimeout(() => {
      this.setData({
        isSpinning: false
      });
      this.showPrizeResult(wonPrize);
    }, 2000);
  },

  // 显示中奖结果
  showPrizeResult: function(wonPrize) {
    console.log('显示中奖结果：', wonPrize);
    
    if (!wonPrize) {
      console.error('wonPrize 为空，无法显示中奖结果');
      this.setData({ isSpinning: false });
      return;
    }

    // 确保wonPrize有完整的数据结构
    const prizeData = {
      id: wonPrize.id || Date.now(),
      name: wonPrize.name || '未知奖品',
      emoji: wonPrize.emoji || '🎁',
      description: wonPrize.description || '恭喜您获得奖品！',
      probability: wonPrize.probability || 0,
      normalizedProbability: wonPrize.normalizedProbability || 0
    };

    console.log('处理后的中奖数据：', prizeData);

    this.setData({
      isSpinning: false,
      showPrizeModal: true,
      wonPrize: prizeData
    });

    // 震动反馈
    wx.vibrateShort();

    // 保存中奖记录
    this.saveLotteryRecord(prizeData);
  },

  // 保存抽奖记录
  saveLotteryRecord: function(prize) {
    console.log('保存抽奖记录，奖品数据：', prize);
    
    // 添加空值检查
    if (!prize) {
      console.error('prize 参数为空，无法保存抽奖记录');
      return;
    }

    // 确保奖品有必要的属性
    if (!prize.id && !prize.name) {
      console.error('奖品缺少必要属性，无法保存记录：', prize);
      return;
    }

    try {
      const records = wx.getStorageSync('lotteryRecords') || [];
      const newRecord = {
        id: Date.now(),
        prizeId: prize.id || Date.now(), // 如果没有id，使用时间戳
        prizeName: prize.name || '未知奖品',
        prizeEmoji: prize.emoji || '🎁',
        prizeImage: prize.image || '',
        timestamp: new Date().getTime(),
        date: new Date().toLocaleDateString()
      };
      
      records.unshift(newRecord);
      // 只保留最近50条记录
      if (records.length > 50) {
        records.splice(50);
      }
      
      wx.setStorageSync('lotteryRecords', records);
      console.log('抽奖记录保存成功：', newRecord);

      // 实时更新最近中奖记录
      this.loadRecentRecords();

      // 检查是否获得成就徽章
      this.checkAchievements(records);
    } catch (error) {
      console.error('保存抽奖记录失败：', error);
    }
  },

  // 检查成就徽章
  checkAchievements: function(records) {
    const achievements = wx.getStorageSync('achievements') || [];
    
    // 首次抽奖成就
    if (records.length === 1) {
      this.unlockAchievement('first_lottery', '初试身手', '完成第一次抽奖');
    }
    
    // 抽奖达人成就
    if (records.length >= 10) {
      this.unlockAchievement('lottery_expert', '抽奖达人', '累计抽奖10次');
    }
    
    // 幸运儿成就（抽中低概率奖品）
    const lastPrize = this.data.prizes.find(p => p.id === records[0].prizeId);
    if (lastPrize && lastPrize.probability <= 5) {
      this.unlockAchievement('lucky_one', '幸运儿', '抽中稀有奖品');
    }
  },

  // 解锁成就
  unlockAchievement: function(id, name, description) {
    const achievements = wx.getStorageSync('achievements') || [];
    const exists = achievements.find(a => a.id === id);
    
    if (!exists) {
      const newAchievement = {
        id: id,
        name: name,
        description: description,
        unlockedAt: new Date().getTime(),
        icon: `/images/achievements/${id}.png`
      };
      
      achievements.push(newAchievement);
      wx.setStorageSync('achievements', achievements);
      
      // 显示成就解锁提示
      setTimeout(() => {
        wx.showToast({
          title: `解锁成就：${name}`,
          icon: 'success',
          duration: 2000
        });
      }, 1000);
    }
  },

  // 关闭中奖弹窗
  closePrizeModal: function() {
    this.setData({
      showPrizeModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，阻止事件冒泡
  },

  // 查看抽奖记录
  viewRecords: function() {
    wx.navigateTo({
      url: '/pages/lottery/record'
    });
  },

  // 抽奖管理
  manageLottery: function() {
    wx.navigateTo({
      url: '/pages/lottery/manage'
    });
  },

  // 查看积分明细
  viewPointsDetail: function() {
    console.log('跳转到积分明细页面');
    wx.navigateTo({
      url: '/pages/profile/points-detail',
      success: function() {
        console.log('跳转积分明细页面成功');
      },
      fail: function(error) {
        console.error('跳转积分明细页面失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 统一更新所有积分相关存储的方法
  updateAllPointsStorage: function(newPoints) {
    try {
      // 更新页面显示
      this.setData({
        userPoints: newPoints
      });
      
      // 更新主要积分存储
      wx.setStorageSync('points', newPoints);
      
      // 同步更新 userPoints（保持兼容性）
      wx.setStorageSync('userPoints', newPoints);
      
      // 更新用户信息中的积分字段
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.points = newPoints;
      userInfo.totalPoints = newPoints; // 同步更新总积分
      wx.setStorageSync('userInfo', userInfo);
      
      console.log(`抽奖页面积分已同步更新为: ${newPoints}`);
    } catch (error) {
      console.error('抽奖页面更新积分存储失败:', error);
    }
  }
});