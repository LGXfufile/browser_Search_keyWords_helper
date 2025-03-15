// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('搜索联想词获取器已安装');
    
    // 初始化存储数据
    chrome.storage.local.set({
        totalWords: 0,
        remainingQuota: 10
    });
});

// 每天凌晨重置剩余次数
chrome.alarms.create('resetQuota', {
    periodInMinutes: 1440 // 24小时
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'resetQuota') {
        chrome.storage.local.set({
            remainingQuota: 10
        });
    }
}); 