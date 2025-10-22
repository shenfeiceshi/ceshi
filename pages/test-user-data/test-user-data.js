// 用户数据管理测试页面
const authUtils = require('../../utils/auth.js');

Page({
  data: {
    currentUserId: '',
    testResults: [],
    isLoading: false
  },

  onLoad() {
    this.loadCurrentUser();
  },

  // 加载当前用户信息
  loadCurrentUser() {
    const currentUserId = wx.getStorageSync('currentUserId');
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({
      currentUserId: currentUserId || '无',
      currentUserInfo: userInfo || {}
    });
  },

  // 测试新用户数据清空
  testNewUser() {
    this.setData({ isLoading: true });
    
    const testUserInfo = {
      id: 'test_new_user_' + Date.now(),
      username: 'test_new_user',
      nickname: '测试新用户'
    };

    try {
      // 先添加一些测试数据，包括积分相关数据
      wx.setStorageSync('points', 100);
      wx.setStorageSync('userPoints', 100);
      wx.setStorageSync('totalPoints', 100);
      wx.setStorageSync('pointsRecords', [{ amount: 50, date: '2024-01-01' }]);
      wx.setStorageSync('userTasks', ['task1', 'task2']);
      wx.setStorageSync('diaries', ['diary1']);
      
      // 调用用户数据管理
      const result = authUtils.manageUserData(testUserInfo);
      
      // 检查数据是否被清空并初始化，特别关注积分数据
      const points = wx.getStorageSync('points');
      const userPoints = wx.getStorageSync('userPoints');
      const totalPoints = wx.getStorageSync('totalPoints');
      const pointsRecords = wx.getStorageSync('pointsRecords');
      const userTasks = wx.getStorageSync('userTasks');
      const diaries = wx.getStorageSync('diaries');
      
      const testResult = {
        type: '新用户测试',
        success: result && points === 0 && userPoints === 0 && totalPoints === 0 && 
                Array.isArray(pointsRecords) && pointsRecords.length === 0 &&
                Array.isArray(userTasks) && userTasks.length === 0,
        details: `积分: ${points}, 用户积分: ${userPoints}, 总积分: ${totalPoints}, 积分记录: ${pointsRecords.length}条, 任务: ${JSON.stringify(userTasks)}, 日记: ${JSON.stringify(diaries)}`
      };
      
      this.addTestResult(testResult);
      
    } catch (error) {
      this.addTestResult({
        type: '新用户测试',
        success: false,
        details: '测试异常: ' + error.message
      });
    }
    
    this.setData({ isLoading: false });
  },

  // 测试老用户数据保留
  testOldUser() {
    this.setData({ isLoading: true });
    
    const testUserId = 'test_old_user_' + Date.now();
    const testUserInfo = {
      id: testUserId,
      username: 'test_old_user',
      nickname: '测试老用户'
    };

    try {
      // 先为这个用户创建一些历史数据，包括积分相关数据
      const mockHistoryData = {
        points: 500,
        userPoints: 500,
        totalPoints: 500,
        pointsRecords: [{ amount: 100, date: '2024-01-01' }, { amount: 200, date: '2024-01-02' }],
        userTasks: ['old_task1', 'old_task2'],
        diaries: ['old_diary1', 'old_diary2'],
        achievements: ['achievement1']
      };
      
      wx.setStorageSync(`userData_${testUserId}`, mockHistoryData);
      
      // 设置当前数据为不同的值
      wx.setStorageSync('points', 0);
      wx.setStorageSync('userTasks', []);
      
      // 调用用户数据管理
      const result = authUtils.manageUserData(testUserInfo);
      
      // 检查数据是否被恢复，特别关注积分数据
      const points = wx.getStorageSync('points');
      const userPoints = wx.getStorageSync('userPoints');
      const totalPoints = wx.getStorageSync('totalPoints');
      const pointsRecords = wx.getStorageSync('pointsRecords');
      const userTasks = wx.getStorageSync('userTasks');
      const achievements = wx.getStorageSync('achievements');
      
      const testResult = {
        type: '老用户测试',
        success: result && points === 500 && userPoints === 500 && totalPoints === 500 && 
                Array.isArray(pointsRecords) && pointsRecords.length === 2 &&
                Array.isArray(userTasks) && userTasks.length === 2,
        details: `积分: ${points}, 用户积分: ${userPoints}, 总积分: ${totalPoints}, 积分记录: ${pointsRecords.length}条, 任务: ${JSON.stringify(userTasks)}, 成就: ${JSON.stringify(achievements)}`
      };
      
      this.addTestResult(testResult);
      
    } catch (error) {
      this.addTestResult({
        type: '老用户测试',
        success: false,
        details: '测试异常: ' + error.message
      });
    }
    
    this.setData({ isLoading: false });
  },

  // 测试用户切换
  testUserSwitch() {
    this.setData({ isLoading: true });
    
    try {
      const user1 = {
        id: 'switch_user_1',
        username: 'user1',
        nickname: '用户1'
      };
      
      const user2 = {
        id: 'switch_user_2', 
        username: 'user2',
        nickname: '用户2'
      };
      
      // 用户1登录并设置数据
      authUtils.manageUserData(user1);
      wx.setStorageSync('points', 200);
      wx.setStorageSync('userTasks', ['user1_task']);
      
      // 用户2登录
      authUtils.manageUserData(user2);
      const user2Points = wx.getStorageSync('points');
      const user2Tasks = wx.getStorageSync('userTasks');
      
      // 切换回用户1
      authUtils.manageUserData(user1);
      const user1Points = wx.getStorageSync('points');
      const user1Tasks = wx.getStorageSync('userTasks');
      
      const testResult = {
        type: '用户切换测试',
        success: user2Points === 0 && user1Points === 200 && Array.isArray(user1Tasks) && user1Tasks.includes('user1_task'),
        details: `用户2积分: ${user2Points}, 用户1积分: ${user1Points}, 用户1任务: ${JSON.stringify(user1Tasks)}`
      };
      
      this.addTestResult(testResult);
      
    } catch (error) {
      this.addTestResult({
        type: '用户切换测试',
        success: false,
        details: '测试异常: ' + error.message
      });
    }
    
    this.setData({ isLoading: false });
  },

  // 添加测试结果
  addTestResult(result) {
    const testResults = this.data.testResults;
    testResults.unshift({
      ...result,
      timestamp: new Date().toLocaleTimeString()
    });
    
    this.setData({ testResults });
  },

  // 清空测试结果
  clearResults() {
    this.setData({ testResults: [] });
  },


});