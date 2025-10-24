// 奖品编辑页面
Page({
  data: {
    mode: 'add', // add 或 edit
    prizeId: null,
    
    // 奖品数据
    prizeData: {
      name: '',
      description: '',
      image: '',
      type: 'virtual', // virtual, badge, physical
      probability: 10,
      status: 'active',
      stockType: 'unlimited', // unlimited, limited
      stock: 10,
      value: 50 // 虚拟奖品的积分价值
    },

    // 类型名称映射
    typeNames: {
      virtual: '虚拟奖品',
      badge: '成就徽章',
      physical: '实物奖品'
    }
  },

  onLoad(options) {
    const { mode, id } = options;
    this.setData({
      mode: mode || 'add',
      prizeId: id || null
    });

    if (mode === 'edit' && id) {
      this.loadPrizeData(id);
    }
  },

  // 加载奖品数据（编辑模式）
  async loadPrizeData(prizeId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'getLotteryPrize',
        data: {
          prizeId: this.data.prizeId
        }
      });
      
      if (result.success && result.data) {
        this.setData({
          prizeData: result.data
        });
      } else {
        wx.showToast({
          title: '加载奖品数据失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载奖品数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } finally {
      wx.hideLoading();
    }
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'prizeData.image': tempFilePath
        });
        
        // 这里可以上传到云存储
        this.uploadImage(tempFilePath);
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传图片到云存储
  uploadImage(filePath) {
    wx.showLoading({
      title: '上传中...'
    });

    // 模拟上传过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    }, 1500);
  },

  // 输入奖品名称
  onNameInput(e) {
    this.setData({
      'prizeData.name': e.detail.value
    });
  },

  // 输入奖品描述
  onDescInput(e) {
    this.setData({
      'prizeData.description': e.detail.value
    });
  },

  // 选择奖品类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'prizeData.type': type
    });

    // 根据类型设置默认值
    if (type === 'virtual') {
      this.setData({
        'prizeData.value': 50
      });
    } else if (type === 'physical') {
      this.setData({
        'prizeData.stockType': 'limited',
        'prizeData.stock': 10
      });
    }
  },

  // 概率变化
  onProbabilityChange(e) {
    this.setData({
      'prizeData.probability': e.detail.value
    });
  },

  // 选择库存类型
  selectStockType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'prizeData.stockType': type
    });

    if (type === 'unlimited') {
      this.setData({
        'prizeData.stock': -1
      });
    } else {
      this.setData({
        'prizeData.stock': 10
      });
    }
  },

  // 输入库存数量
  onStockInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'prizeData.stock': value
    });
  },

  // 输入奖品价值
  onValueInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'prizeData.value': value
    });
  },

  // 状态开关变化
  onStatusChange(e) {
    this.setData({
      'prizeData.status': e.detail.value ? 'active' : 'inactive'
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 保存奖品
  async savePrize() {
    const { prizeData, mode, prizeId } = this.data;

    // 表单验证
    if (!prizeData.name.trim()) {
      wx.showToast({
        title: '请输入奖品名称',
        icon: 'none'
      });
      return;
    }

    if (!prizeData.description.trim()) {
      wx.showToast({
        title: '请输入奖品描述',
        icon: 'none'
      });
      return;
    }

    if (prizeData.type === 'physical' && prizeData.stockType === 'limited' && prizeData.stock <= 0) {
      wx.showToast({
        title: '请输入有效的库存数量',
        icon: 'none'
      });
      return;
    }

    if (prizeData.type === 'virtual' && prizeData.value <= 0) {
      wx.showToast({
        title: '请输入有效的积分价值',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: mode === 'add' ? '添加中...' : '保存中...'
      });

      const functionName = mode === 'add' ? 'createLotteryPrize' : 'updateLotteryPrize';
      const params = mode === 'add' ? prizeData : { prizeId, ...prizeData };
      
      const result = await wx.cloud.callFunction({
          name: functionName,
          data: params
        });
      
      if (result.success) {
        wx.showToast({
          title: mode === 'add' ? '添加成功' : '保存成功',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        wx.showToast({
          title: result.error || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存奖品失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '成长日记 - 奖品管理',
      path: '/pages/index/index'
    };
  }
});