// 抽奖管理页面
Page({
  data: {
    // 全局设置
    lotteryCost: 10, // 每轮抽奖消耗积分
    
    // 奖品列表
    prizeList: [
      {
        id: 1,
        name: '小红花',
        description: '获得一朵小红花奖励！',
        emoji: '🌺',
        probability: 30
      },
      {
        id: 2,
        name: '金币奖励',
        description: '获得额外10积分奖励！',
        emoji: '💰',
        probability: 25
      },
      {
        id: 3,
        name: '学习徽章',
        description: '获得学习小能手徽章！',
        emoji: '🏆',
        probability: 20
      },
      {
        id: 4,
        name: '彩虹贴纸',
        description: '获得漂亮的彩虹贴纸！',
        emoji: '🌈',
        probability: 15
      },
      {
        id: 5,
        name: '神秘礼物',
        description: '获得神秘大礼包！',
        emoji: '🎁',
        probability: 8
      },
      {
        id: 6,
        name: '超级奖励',
        description: '获得超级大奖！',
        emoji: '⭐',
        probability: 2
      }
    ],
    
    // 弹窗状态
    showPrizeModal: false,
    editMode: 'add', // 'add' 或 'edit'
    currentPrize: {
      id: null,
      name: '',
      description: '',
      emoji: '🎁',
      probability: 10
    },
    
    // 可选的emoji图标
    emojiList: ['🎁', '🌺', '💰', '🏆', '🌈', '⭐', '🎉', '🎊', '🎈', '🍭', '🍎', '📚', '✨', '💎', '🎯', '🏅']
  },

  onLoad() {
    this.loadSettings();
    this.loadPrizeList();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadSettings();
    this.loadPrizeList();
  },

  // 加载设置
  async loadSettings() {
    try {
      const result = await wx.cloud.callFunction({
      name: 'getLotteryConfig',
      data: {}
    });
      if (result.success && result.data) {
        this.setData({
          lotteryCost: result.data.cost || 10
        });
      } else {
        this.setData({
          lotteryCost: 10
        });
      }
    } catch (error) {
      console.error('加载抽奖设置失败:', error);
      this.setData({
        lotteryCost: 10
      });
    }
  },

  // 加载奖品列表
  async loadPrizeList() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getLotteryPrizes',
        data: {}
      });
      if (result.success && result.data && result.data.length > 0) {
        this.setData({
          prizeList: result.data
        });
      } else {
        // 如果没有数据，使用默认数据并保存
        await this.savePrizeList();
      }
    } catch (error) {
      console.error('加载奖品列表失败:', error);
      // 使用默认数据
      await this.savePrizeList();
    }
  },

  // 保存奖品列表到云端
  async savePrizeList() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'updateLotteryPrizes',
        data: {
          prizes: this.data.prizeList
        }
      });
      if (!result.success) {
        console.error('保存奖品列表失败:', result.error);
      }
    } catch (error) {
      console.error('保存奖品列表失败:', error);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 修改抽奖消耗积分
  async onCostInput(e) {
    const cost = parseInt(e.detail.value) || 10;
    this.setData({
      lotteryCost: cost
    });
    
    // 保存到云端
    try {
      const result = await wx.cloud.callFunction({
        name: 'updateLotteryConfig',
        data: {
          cost: cost
        }
      });
      if (!result.success) {
        console.error('保存抽奖设置失败:', result.error);
      }
    } catch (error) {
      console.error('保存抽奖设置失败:', error);
    }
  },

  // 添加奖品
  addPrize() {
    this.setData({
      showPrizeModal: true,
      editMode: 'add',
      currentPrize: {
        id: null,
        name: '',
        description: '',
        emoji: '🎁',
        probability: 10
      }
    });
  },

  // 编辑奖品
  editPrize(e) {
    const prizeId = parseInt(e.currentTarget.dataset.id);
    const prize = this.data.prizeList.find(p => p.id === prizeId);
    
    if (prize) {
      this.setData({
        showPrizeModal: true,
        editMode: 'edit',
        currentPrize: { ...prize }
      });
    }
  },

  // 删除奖品
  deletePrize(e) {
    const prizeId = parseInt(e.currentTarget.dataset.id);
    const prize = this.data.prizeList.find(p => p.id === prizeId);

    wx.showModal({
      title: '确认删除',
      content: `确定要删除奖品"${prize.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          const updatedPrizes = this.data.prizeList.filter(p => p.id !== prizeId);
          this.setData({
            prizeList: updatedPrizes
          });
          
          // 保存到云端
          await this.savePrizeList();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关闭奖品弹窗
  closePrizeModal() {
    this.setData({
      showPrizeModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，阻止事件冒泡
  },

  // 奖品名称输入
  onNameInput(e) {
    this.setData({
      'currentPrize.name': e.detail.value
    });
  },

  // 奖品描述输入
  onDescInput(e) {
    this.setData({
      'currentPrize.description': e.detail.value
    });
  },

  // 概率输入
  onProbabilityInput(e) {
    const probability = parseInt(e.detail.value) || 0;
    this.setData({
      'currentPrize.probability': probability
    });
  },

  // 选择emoji
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    this.setData({
      'currentPrize.emoji': emoji
    });
  },

  // 确认添加/编辑奖品
  async confirmPrize() {
    const { currentPrize, editMode, prizeList } = this.data;
    
    // 验证输入
    if (!currentPrize.name.trim()) {
      wx.showToast({
        title: '请输入奖品名称',
        icon: 'none'
      });
      return;
    }
    
    if (!currentPrize.description.trim()) {
      wx.showToast({
        title: '请输入奖品描述',
        icon: 'none'
      });
      return;
    }
    
    if (currentPrize.probability <= 0 || currentPrize.probability > 100) {
      wx.showToast({
        title: '概率必须在1-100之间',
        icon: 'none'
      });
      return;
    }

    let updatedPrizes = [...prizeList];
    
    if (editMode === 'add') {
      // 添加新奖品
      const newId = Math.max(...prizeList.map(p => p.id), 0) + 1;
      const newPrize = {
        ...currentPrize,
        id: newId,
        name: currentPrize.name.trim(),
        description: currentPrize.description.trim()
      };
      updatedPrizes.push(newPrize);
    } else {
      // 编辑现有奖品
      updatedPrizes = prizeList.map(prize => {
        if (prize.id === currentPrize.id) {
          return {
            ...currentPrize,
            name: currentPrize.name.trim(),
            description: currentPrize.description.trim()
          };
        }
        return prize;
      });
    }
    
    this.setData({
      prizeList: updatedPrizes,
      showPrizeModal: false
    });
    
    // 保存到云端
    await this.savePrizeList();
    
    wx.showToast({
      title: editMode === 'add' ? '添加成功' : '保存成功',
      icon: 'success'
    });
  }
});