// 小六日记编辑页面 - AI智能配图
Page({
  data: {
    // 基础数据
    selectedDate: '',
    selectedMood: '',
    selectedWeather: '',
    content: '',
    contentLength: 0,
    maxContentLength: 1000,
    
    // 心情选项
    moodOptions: [
      { id: 'happy', emoji: '😊', name: '开心' },
      { id: 'excited', emoji: '😆', name: '兴奋' },
      { id: 'calm', emoji: '😌', name: '平静' },
      { id: 'sad', emoji: '😢', name: '难过' },
      { id: 'angry', emoji: '😠', name: '生气' },
      { id: 'tired', emoji: '😴', name: '疲惫' },
      { id: 'surprised', emoji: '😲', name: '惊讶' },
      { id: 'confused', emoji: '😕', name: '困惑' }
    ],
    
    // 天气选项
    weatherOptions: [
      { id: 'sunny', emoji: '☀️', name: '晴天' },
      { id: 'cloudy', emoji: '☁️', name: '多云' },
      { id: 'rainy', emoji: '🌧️', name: '下雨' },
      { id: 'snowy', emoji: '❄️', name: '下雪' },
      { id: 'windy', emoji: '💨', name: '大风' },
      { id: 'foggy', emoji: '🌫️', name: '雾天' }
    ],
    
    // 图片相关
    uploadedImages: [],
    maxImages: 9,
    
    // 标签相关
    selectedTags: [],
    recommendedTags: ['学习', '游戏', '运动', '阅读', '旅行', '美食', '朋友', '家人'],
    customTagInput: '',
    
    // AI配图相关
    isAiGenerating: false,
    aiSuggestions: [],
    selectedSuggestion: null,
    
    // AI评价相关
    isAiCommenting: false,
    aiComment: null,
    
    // 草稿相关
    isDraft: false,
    draftId: null
  },

  onLoad(options) {
    // 初始化日期为今天
    const today = new Date();
    const dateStr = this.formatDate(today);
    this.setData({
      selectedDate: dateStr
    });

    // 如果是编辑模式，加载草稿数据
    if (options.draftId) {
      this.loadDraft(options.draftId);
    }
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  // 心情选择
  selectMood(e) {
    const moodId = e.currentTarget.dataset.mood;
    this.setData({
      selectedMood: moodId
    });
    
    // 心情变化时，重新生成AI配图建议
    this.generateAiSuggestions();
  },

  // 天气选择
  selectWeather(e) {
    const weatherId = e.currentTarget.dataset.weather;
    this.setData({
      selectedWeather: weatherId
    });
  },

  // 内容输入
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content: content,
      contentLength: content.length
    });
    
    // 内容变化时，重新生成AI配图建议
    this.debounceGenerateAi();
  },

  // 防抖生成AI建议
  debounceGenerateAi() {
    clearTimeout(this.aiTimer);
    this.aiTimer = setTimeout(() => {
      this.generateAiSuggestions();
    }, 1000);
  },

  // 生成AI配图建议
  async generateAiSuggestions() {
    if (!this.data.content.trim() && !this.data.selectedMood) {
      return;
    }

    this.setData({ isAiGenerating: true });

    try {
      // 模拟AI生成配图建议
      await this.simulateAiGeneration();
      
      const suggestions = this.getMockAiSuggestions();
      this.setData({
        aiSuggestions: suggestions,
        isAiGenerating: false
      });
    } catch (error) {
      console.error('AI配图生成失败:', error);
      wx.showToast({
        title: 'AI配图生成失败',
        icon: 'none'
      });
      this.setData({ isAiGenerating: false });
    }
  },

  // 模拟AI生成延迟
  simulateAiGeneration() {
    return new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  },

  // 获取模拟AI配图建议
  getMockAiSuggestions() {
    const { content, selectedMood } = this.data;
    const suggestions = [];

    // 根据内容和心情生成不同的配图建议
    if (content.includes('学习') || content.includes('作业')) {
      suggestions.push({
        id: 'study',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20child%20studying%20with%20books%20and%20pencils%2C%20warm%20orange%20color%20scheme&image_size=square',
        desc: '学习场景配图'
      });
    }

    if (content.includes('游戏') || content.includes('玩')) {
      suggestions.push({
        id: 'play',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20children%20playing%20games%2C%20colorful%20and%20joyful%20atmosphere&image_size=square',
        desc: '游戏娱乐配图'
      });
    }

    if (selectedMood === 'happy' || selectedMood === 'excited') {
      suggestions.push({
        id: 'happy',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20sunny%20day%20with%20rainbow%20and%20flowers%2C%20cheerful%20cartoon%20style&image_size=square',
        desc: '开心快乐配图'
      });
    }

    if (content.includes('朋友') || content.includes('同学')) {
      suggestions.push({
        id: 'friends',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20children%20friends%20playing%20together%2C%20warm%20and%20friendly%20atmosphere&image_size=square',
        desc: '友谊主题配图'
      });
    }

    // 默认建议
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'default',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20diary%20illustration%20with%20warm%20colors%2C%20child%20friendly%20design&image_size=square',
        desc: '日记主题配图'
      });
    }

    return suggestions.slice(0, 3); // 最多返回3个建议
  },

  // 选择AI配图建议
  selectAiSuggestion(e) {
    const suggestionId = e.currentTarget.dataset.id;
    const suggestion = this.data.aiSuggestions.find(s => s.id === suggestionId);
    
    this.setData({
      selectedSuggestion: suggestionId
    });

    // 将选中的AI配图添加到上传图片列表
    if (suggestion && this.data.uploadedImages.length < this.data.maxImages) {
      const newImages = [...this.data.uploadedImages, {
        id: Date.now(),
        url: suggestion.image,
        isAiGenerated: true
      }];
      
      this.setData({
        uploadedImages: newImages
      });

      wx.showToast({
        title: '已添加AI配图',
        icon: 'success'
      });
    }
  },

  // 从相册选择图片
  chooseFromAlbum() {
    const remainingSlots = this.data.maxImages - this.data.uploadedImages.length;
    if (remainingSlots <= 0) {
      wx.showToast({
        title: `最多只能上传${this.data.maxImages}张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remainingSlots,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => ({
          id: Date.now() + Math.random(),
          url: file.tempFilePath,
          isAiGenerated: false
        }));

        this.setData({
          uploadedImages: [...this.data.uploadedImages, ...newImages]
        });

        wx.showToast({
          title: '图片添加成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        // 如果wx.chooseMedia不支持，回退到wx.chooseImage
        wx.chooseImage({
          count: remainingSlots,
          sizeType: ['compressed'],
          sourceType: ['album'],
          success: (res) => {
            const newImages = res.tempFilePaths.map(path => ({
              id: Date.now() + Math.random(),
              url: path,
              isAiGenerated: false
            }));

            this.setData({
              uploadedImages: [...this.data.uploadedImages, ...newImages]
            });

            wx.showToast({
              title: '图片添加成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('选择图片失败:', error);
            wx.showToast({
              title: '选择图片失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 现场拍照
  takePhoto() {
    const remainingSlots = this.data.maxImages - this.data.uploadedImages.length;
    if (remainingSlots <= 0) {
      wx.showToast({
        title: `最多只能上传${this.data.maxImages}张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const newImages = res.tempFiles.map(file => ({
          id: Date.now() + Math.random(),
          url: file.tempFilePath,
          isAiGenerated: false
        }));

        this.setData({
          uploadedImages: [...this.data.uploadedImages, ...newImages]
        });

        wx.showToast({
          title: '拍照成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        // 如果wx.chooseMedia不支持，回退到wx.chooseImage
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['camera'],
          success: (res) => {
            const newImages = res.tempFilePaths.map(path => ({
              id: Date.now() + Math.random(),
              url: path,
              isAiGenerated: false
            }));

            this.setData({
              uploadedImages: [...this.data.uploadedImages, ...newImages]
            });

            wx.showToast({
              title: '拍照成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('拍照失败:', error);
            wx.showToast({
              title: '拍照失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // AI生成图片
  async generateAIImage() {
    // 检查日记内容是否足够
    if (this.data.content.length < 10) {
      wx.showModal({
        title: '提示',
        content: '请先写一些日记内容（至少10个字符）再生成AI图片哦～',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    const remainingSlots = this.data.maxImages - this.data.uploadedImages.length;
    if (remainingSlots <= 0) {
      wx.showToast({
        title: `最多只能上传${this.data.maxImages}张图片`,
        icon: 'none'
      });
      return;
    }

    // 检查是否选择了心情和天气
    if (!this.data.selectedMood || !this.data.selectedWeather) {
      wx.showToast({
        title: '请先选择心情和天气',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isAiGenerating: true
    });

    try {
      // 获取当前选择的心情和天气名称
      const selectedMoodObj = this.data.moodOptions.find(mood => mood.id === this.data.selectedMood);
      const selectedWeatherObj = this.data.weatherOptions.find(weather => weather.id === this.data.selectedWeather);
      
      const moodName = selectedMoodObj ? selectedMoodObj.name : '';
      const weatherName = selectedWeatherObj ? selectedWeatherObj.name : '';

      // 调用云托管API生成图片
      const result = await getApp().callCloudAPI('/api/ai/generate-image', {
        content: this.data.content,
        mood: moodName,
        weather: weatherName
      }, 'AI生成中...');
      
      if (result && result.imageUrl) {
        // 生成AI图片对象
        const aiImage = {
          id: Date.now() + Math.random(),
          url: result.imageUrl,
          isAiGenerated: true
        };

        this.setData({
          uploadedImages: [...this.data.uploadedImages, aiImage],
          isAiGenerating: false
        });

        wx.showToast({
          title: 'AI图片生成成功',
          icon: 'success'
        });
      } else {
        throw new Error('API返回的图片URL为空');
      }
    } catch (error) {
      console.error('AI生成图片失败:', error);
      this.setData({
        isAiGenerating: false
      });
      
      wx.showToast({
        title: error.message || 'AI生成失败，请重试',
        icon: 'none',
        duration: 3000
      });
    }
  },



  // 模拟AI图片生成过程（保留作为备用）
  simulateAIImageGeneration() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000); // 模拟2秒生成时间
    });
  },

  // 获取模拟的AI生成图片（保留作为备用）
  getMockAIImage() {
    // 这里返回一个模拟的图片URL
    // 实际应用中应该调用真实的AI图片生成API
    const mockImages = [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3',
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5'
    ];
    return mockImages[Math.floor(Math.random() * mockImages.length)];
  },

  // 删除图片
  deleteImage(e) {
    const imageId = e.currentTarget.dataset.id;
    const updatedImages = this.data.uploadedImages.filter(img => img.id !== imageId);
    this.setData({
      uploadedImages: updatedImages
    });
  },

  // 预览图片
  previewImage(e) {
    const imageUrl = e.currentTarget.dataset.url;
    const urls = this.data.uploadedImages.map(img => img.url);
    
    wx.previewImage({
      current: imageUrl,
      urls: urls
    });
  },

  // 标签选择
  selectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = [...this.data.selectedTags];
    
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      if (selectedTags.length < 5) {
        selectedTags.push(tag);
      } else {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      selectedTags: selectedTags
    });
  },

  // 自定义标签输入
  onCustomTagInput(e) {
    this.setData({
      customTagInput: e.detail.value
    });
  },

  // 添加推荐标签
  addTag(e) {
    const tag = e.currentTarget.dataset.tag;
    if (!tag || this.data.selectedTags.includes(tag)) {
      return;
    }

    const newTags = [...this.data.selectedTags, tag];
    this.setData({
      selectedTags: newTags
    });

    wx.showToast({
      title: '标签已添加',
      icon: 'success',
      duration: 1000
    });
  },

  // 内容输入失焦事件
  onContentBlur(e) {
    // 可以在这里处理内容失焦后的逻辑
    // 比如自动保存草稿、触发AI分析等
    const content = e.detail.value;
    if (content && content.length > 0) {
      // 自动保存草稿
      this.saveDraft();
    }
  },

  // 添加自定义标签
  addCustomTag() {
    const tag = this.data.customTagInput.trim();
    if (!tag) return;
    
    if (this.data.selectedTags.includes(tag)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.selectedTags.length >= 5) {
      wx.showToast({
        title: '最多选择5个标签',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      selectedTags: [...this.data.selectedTags, tag],
      customTagInput: ''
    });
  },

  // 生成AI评价
  async generateAiComment() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请先写一些内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ isAiCommenting: true });

    try {
      await this.simulateAiGeneration();
      
      const comment = this.getMockAiComment();
      this.setData({
        aiComment: comment,
        isAiCommenting: false
      });
    } catch (error) {
      console.error('AI评价生成失败:', error);
      wx.showToast({
        title: 'AI评价生成失败',
        icon: 'none'
      });
      this.setData({ isAiCommenting: false });
    }
  },

  // 获取模拟AI评价
  getMockAiComment() {
    const { content, selectedMood } = this.data;
    const comments = [];

    // 根据内容生成不同的评价
    if (content.includes('学习') || content.includes('作业')) {
      comments.push('哇！你今天很认真地学习呢！继续保持这种好习惯，你会越来越棒的！📚✨');
    }

    if (content.includes('朋友') || content.includes('同学')) {
      comments.push('和朋友在一起的时光总是特别美好！友谊是最珍贵的宝藏呢！👫💕');
    }

    if (content.includes('游戏') || content.includes('玩')) {
      comments.push('适当的游戏和娱乐能让我们放松心情！记得劳逸结合哦！🎮😊');
    }

    if (selectedMood === 'happy' || selectedMood === 'excited') {
      comments.push('看到你这么开心，我也感到很快乐呢！希望你每天都能保持这样的好心情！😄🌈');
    }

    if (selectedMood === 'sad' || selectedMood === 'tired') {
      comments.push('每个人都会有不开心的时候，这很正常。记住，明天又是美好的一天！加油！🌟💪');
    }

    // 默认评价
    if (comments.length === 0) {
      comments.push('你的日记写得真棒！记录生活的点点滴滴，让每一天都变得有意义！继续加油哦！📝💖');
    }

    return {
      text: comments[Math.floor(Math.random() * comments.length)],
      time: new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  },

  // 保存草稿
  saveDraft() {
    const draftData = this.getDiaryData();
    draftData.isDraft = true;
    draftData.updateTime = new Date().toISOString();

    try {
      const drafts = wx.getStorageSync('diary_drafts') || [];
      
      if (this.data.draftId) {
        // 更新现有草稿
        const index = drafts.findIndex(d => d.id === this.data.draftId);
        if (index > -1) {
          drafts[index] = { ...draftData, id: this.data.draftId };
        }
      } else {
        // 创建新草稿
        const draftId = Date.now().toString();
        drafts.push({ ...draftData, id: draftId });
        this.setData({ draftId });
      }

      wx.setStorageSync('diary_drafts', drafts);
      wx.showToast({
        title: '草稿已保存',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存草稿失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 发布日记
  publishDiary() {
    const diaryData = this.getDiaryData();
    
    // 验证必填字段
    if (!diaryData.content.trim()) {
      wx.showToast({
        title: '请输入日记内容',
        icon: 'none'
      });
      return;
    }

    try {
      const diaries = wx.getStorageSync('diaries') || [];
      const diaryId = Date.now().toString();
      
      const newDiary = {
        ...diaryData,
        id: diaryId,
        isDraft: false,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      diaries.unshift(newDiary);
      wx.setStorageSync('diaries', diaries);

      // 如果是从草稿发布，删除草稿
      if (this.data.draftId) {
        this.deleteDraft(this.data.draftId);
      }

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('发布日记失败:', error);
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      });
    }
  },

  // 获取日记数据
  getDiaryData() {
    return {
      date: this.data.selectedDate,
      mood: this.data.selectedMood,
      weather: this.data.selectedWeather,
      content: this.data.content,
      images: this.data.uploadedImages,
      tags: this.data.selectedTags,
      aiComment: this.data.aiComment
    };
  },

  // 加载草稿
  loadDraft(draftId) {
    try {
      const drafts = wx.getStorageSync('diary_drafts') || [];
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        this.setData({
          draftId: draftId,
          selectedDate: draft.date || this.data.selectedDate,
          selectedMood: draft.mood || '',
          selectedWeather: draft.weather || '',
          content: draft.content || '',
          contentLength: (draft.content || '').length,
          uploadedImages: draft.images || [],
          selectedTags: draft.tags || [],
          aiComment: draft.aiComment || null,
          isDraft: true
        });
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
    }
  },

  // 删除草稿
  deleteDraft(draftId) {
    try {
      const drafts = wx.getStorageSync('diary_drafts') || [];
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      wx.setStorageSync('diary_drafts', updatedDrafts);
    } catch (error) {
      console.error('删除草稿失败:', error);
    }
  },

  onUnload() {
    // 清理定时器
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
    }
  }
});