// 开发模式配置
const config = { DEV_MODE: true, VERSION: '1.0.0' };

// 开发模式下的重载函数
async function reloadExtension() {
    if (config.DEV_MODE) {
        console.log('开发模式：准备重新加载插件...');
        
        // 清理现有状态
        await chrome.storage.local.clear();
        
        // 重新初始化
        await initializeExtension();
        
        // 通知所有标签页重新加载
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            if (tab.url.includes('baidu.com') || tab.url.includes('google.com')) {
                chrome.tabs.reload(tab.id);
            }
        });
        
        console.log('插件已重新加载完成');
    }
}

// 初始化函数
async function initializeExtension() {
    console.log('搜索联想词获取器已初始化，版本：', config.VERSION);
    
    // 初始化存储数据
    await chrome.storage.local.set({
        totalWords: 0,
        remainingQuota: 10,
        lastInitTime: Date.now()
    });

    // 创建定时任务
    await createAlarm();
}

// 创建定时任务
async function createAlarm() {
    // 删除已存在的闹钟（如果有）
    await chrome.alarms.clear('resetQuota');
    
    // 创建新的闹钟
    await chrome.alarms.create('resetQuota', {
        periodInMinutes: 1440 // 24小时
    });
}

// 监听插件安装和更新事件
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('插件事件:', details.reason);
    
    // 无论什么情况，都初始化数据
    await initializeExtension();
});

// 监听定时任务
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'resetQuota') {
        console.log('重置每日配额');
        await chrome.storage.local.set({
            remainingQuota: 10
        });
    }
});

// 监听开发模式下的重载消息
if (config.DEV_MODE) {
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.action === 'reload') {
            await reloadExtension();
            sendResponse({ success: true });
        }
    });
}

// 监听内容脚本加载消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "contentScriptLoaded") {
        console.log('内容脚本已加载在页面:', request.url);
    }
});

// 确保服务工作正常运行
console.log('Background service worker 已启动'); 