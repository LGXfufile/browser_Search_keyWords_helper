// 获取DOM元素
const totalWordsElement = document.getElementById('totalWords');
const remainingQuotaElement = document.getElementById('remainingQuota');
const getSuggestionsButton = document.getElementById('getSuggestions');
const exportToExcelButton = document.getElementById('exportToExcel');
const upgradeButton = document.getElementById('upgradeBtn');
const resultsSection = document.getElementById('resultsSection');
const tagsContainer = document.getElementById('tagsContainer');
const tagCountElement = document.getElementById('tagCount');

// 关键词详情相关元素
const overlay = document.getElementById('overlay');
const keywordDetails = document.getElementById('keywordDetails');
const keywordTitle = document.getElementById('keywordTitle');
const searchVolumeElement = document.getElementById('searchVolume');
const competitionElement = document.getElementById('competition');
const clickValueElement = document.getElementById('clickValue');
const recommendIndexElement = document.getElementById('recommendIndex');
const copyKeywordButton = document.getElementById('copyKeyword');
const closeDetailsButton = document.getElementById('closeDetails');

// 存储数据
let suggestions = [];
let totalWords = 0;
let remainingQuota = 10;

// 当前选中的关键词
let currentKeyword = '';

// 初始化
function initialize() {
    // 从存储中加载数据
    chrome.storage.local.get(['totalWords', 'remainingQuota'], (result) => {
        totalWords = result.totalWords || 0;
        remainingQuota = result.remainingQuota || 10;
        
        // 更新UI
        totalWordsElement.textContent = totalWords;
        remainingQuotaElement.textContent = remainingQuota;
    });
}

// 获取联想词
async function getSuggestions() {
    if (remainingQuota <= 0) {
        alert('今日免费次数已用完，请升级专业版继续使用');
        return;
    }
    
    getSuggestionsButton.textContent = '获取中...';
    getSuggestionsButton.disabled = true;
    
    try {
        console.log('开始获取联想词...');
        
        // 获取当前活动标签页
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            throw new Error('无法获取当前标签页');
        }
        
        const tab = tabs[0];
        console.log('当前标签页:', tab.url);
        
        // 检查是否在搜索页面
        if (!tab.url.includes('baidu.com') && !tab.url.includes('google.com')) {
            alert('请在百度或谷歌搜索页面使用此功能');
            return;
        }
        
        // 注入内容脚本（确保脚本已加载）
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-scripts/content.js']
            });
            console.log('内容脚本注入成功');
        } catch (err) {
            console.log('内容脚本可能已存在:', err);
        }
        
        // 发送消息给内容脚本
        console.log('发送获取联想词请求...');
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getSuggestions" });
        console.log('收到响应:', response);
        
        if (response && response.suggestions && response.suggestions.length > 0) {
            suggestions = response.suggestions;
            totalWords += suggestions.length;
            remainingQuota--;
            
            // 保存更新后的数据到 storage
            chrome.storage.local.set({
                totalWords: totalWords,
                remainingQuota: remainingQuota
            });
            
            // 更新UI
            totalWordsElement.textContent = totalWords;
            remainingQuotaElement.textContent = remainingQuota;
            
            // 显示结果
            displaySuggestions(suggestions);
            resultsSection.classList.remove('hidden');
            
            // 显示成功消息
            showToast(`成功获取 ${suggestions.length} 个联想词`);
        } else {
            alert('未找到相关联想词，请在搜索结果页面尝试');
        }
    } catch (error) {
        console.error('获取联想词失败:', error);
        alert(`获取失败: ${error.message}`);
    } finally {
        getSuggestionsButton.textContent = '获取联想词';
        getSuggestionsButton.disabled = false;
    }
}

// 显示联想词（更新版本，包含权重）
function displaySuggestions(suggestions) {
    tagsContainer.innerHTML = '';
    tagCountElement.textContent = suggestions.length;
    
    // 获取关键词权重
    const keywordWeights = estimateKeywordWeights(suggestions);
    
    suggestions.forEach((suggestion, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = suggestion;
        
        // 添加权重指示器
        const weight = keywordWeights[index];
        const weightElement = document.createElement('span');
        weightElement.className = `tag-weight ${weight.level}`;
        weightElement.textContent = weight.score;
        tag.appendChild(weightElement);
        
        // 添加点击事件，显示详情
        tag.addEventListener('click', () => {
            showKeywordDetails(suggestion, weight);
        });
        
        tagsContainer.appendChild(tag);
    });
}

// 估算关键词权重
function estimateKeywordWeights(keywords) {
    return keywords.map(keyword => {
        // 基于关键词长度、特殊字符和常见词汇的简单算法
        let score = 0;
        
        // 1. 长度因素 (较短的关键词通常搜索量更大)
        const length = keyword.length;
        if (length <= 5) score += 30;
        else if (length <= 10) score += 20;
        else if (length <= 15) score += 10;
        
        // 2. 特殊字符 (包含特殊字符的关键词通常搜索量较小)
        const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (!specialChars.test(keyword)) score += 15;
        
        // 3. 常见词汇 (包含常见词汇的关键词通常搜索量较大)
        const commonWords = ['怎么', '如何', '教程', '方法', '价格', '多少钱', '哪里', '推荐', '排名', '最好'];
        for (const word of commonWords) {
            if (keyword.includes(word)) score += 10;
        }
        
        // 4. 地域词汇 (包含地域词汇的关键词通常有明确意图)
        const locationWords = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '中国'];
        for (const word of locationWords) {
            if (keyword.includes(word)) score += 15;
        }
        
        // 5. 商业意图 (包含商业意图的关键词通常价值更高)
        const commercialWords = ['购买', '价格', '优惠', '便宜', '促销', '折扣', '团购', '官网', '专卖', '旗舰店'];
        for (const word of commercialWords) {
            if (keyword.includes(word)) score += 20;
        }
        
        // 随机因素，模拟真实数据的波动
        score += Math.floor(Math.random() * 20);
        
        // 确保分数在0-100之间
        score = Math.min(100, Math.max(0, score));
        
        // 确定级别
        let level = 'low';
        if (score >= 70) level = 'high';
        else if (score >= 40) level = 'medium';
        
        return {
            score,
            level,
            searchVolume: estimateSearchVolume(score),
            competition: estimateCompetition(score),
            clickValue: estimateClickValue(score, keyword)
        };
    });
}

// 估算月搜索量
function estimateSearchVolume(score) {
    // 基于分数估算月搜索量
    let baseVolume = 0;
    
    if (score >= 80) baseVolume = 10000 + Math.floor(Math.random() * 90000);
    else if (score >= 60) baseVolume = 5000 + Math.floor(Math.random() * 5000);
    else if (score >= 40) baseVolume = 1000 + Math.floor(Math.random() * 4000);
    else if (score >= 20) baseVolume = 100 + Math.floor(Math.random() * 900);
    else baseVolume = 10 + Math.floor(Math.random() * 90);
    
    // 添加一些随机波动
    const variance = Math.floor(baseVolume * 0.2 * (Math.random() - 0.5));
    const volume = baseVolume + variance;
    
    // 格式化数字
    return volume.toLocaleString();
}

// 估算竞争度
function estimateCompetition(score) {
    // 竞争度与分数成反比 (高分数关键词通常竞争更激烈)
    let competition = 0;
    
    if (score >= 80) competition = 0.7 + Math.random() * 0.3;
    else if (score >= 60) competition = 0.5 + Math.random() * 0.3;
    else if (score >= 40) competition = 0.3 + Math.random() * 0.3;
    else if (score >= 20) competition = 0.1 + Math.random() * 0.3;
    else competition = Math.random() * 0.2;
    
    // 格式化为百分比
    return (competition * 100).toFixed(1) + '%';
}

// 估算点击价值
function estimateClickValue(score, keyword) {
    // 基础点击价值
    let baseValue = score / 20; // 0-5元范围
    
    // 商业关键词价值更高
    const commercialWords = ['购买', '价格', '优惠', '便宜', '促销', '折扣', '团购', '官网', '专卖', '旗舰店'];
    for (const word of commercialWords) {
        if (keyword.includes(word)) baseValue += 1;
    }
    
    // 添加随机波动
    const variance = baseValue * 0.2 * (Math.random() - 0.5);
    const value = baseValue + variance;
    
    // 格式化为货币
    return value.toFixed(2) + '元';
}

// 显示关键词详情
function showKeywordDetails(keyword, weightData) {
    currentKeyword = keyword;
    
    // 设置详情内容
    keywordTitle.textContent = keyword;
    searchVolumeElement.textContent = weightData.searchVolume;
    competitionElement.textContent = weightData.competition;
    clickValueElement.textContent = weightData.clickValue;
    
    // 计算推荐指数
    const score = weightData.score;
    let recommendText = '';
    let recommendClass = '';
    
    if (score >= 80) {
        recommendText = '极高';
        recommendClass = 'high';
    } else if (score >= 60) {
        recommendText = '较高';
        recommendClass = 'high';
    } else if (score >= 40) {
        recommendText = '中等';
        recommendClass = 'medium';
    } else if (score >= 20) {
        recommendText = '较低';
        recommendClass = 'low';
    } else {
        recommendText = '极低';
        recommendClass = 'low';
    }
    
    recommendIndexElement.textContent = recommendText;
    recommendIndexElement.className = `value ${recommendClass}`;
    
    // 显示弹窗
    overlay.classList.add('show');
    keywordDetails.classList.add('show');
}

// 关闭关键词详情
function closeKeywordDetails() {
    overlay.classList.remove('show');
    keywordDetails.classList.remove('show');
    currentKeyword = '';
}

// 复制当前关键词
function copyCurrentKeyword() {
    if (currentKeyword) {
        try {
            // 创建一个临时文本区域
            const textArea = document.createElement('textarea');
            textArea.value = currentKeyword;
            
            // 确保文本区域不可见
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            
            // 选择文本并复制
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            
            // 移除临时元素
            document.body.removeChild(textArea);
            
            if (successful) {
                showToast('已复制到剪贴板');
                closeKeywordDetails();
            } else {
                throw new Error('复制失败');
            }
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        }
    }
}

// 显示提示消息
function showToast(message) {
    // 检查是否已存在toast元素
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // 设置消息并显示
    toast.textContent = message;
    toast.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 导出Excel（更新版本，包含权重数据）
function exportToExcel() {
    if (suggestions.length === 0) {
        alert('暂无数据可导出');
        return;
    }
    
    try {
        // 获取关键词权重
        const keywordWeights = estimateKeywordWeights(suggestions);
        
        // 添加BOM头以确保Excel正确识别UTF-8编码
        const BOM = "\uFEFF";
        
        // 创建CSV内容
        let csvContent = BOM + "序号,联想词,推荐指数,月搜索量,竞争度,点击价值\n";
        suggestions.forEach((word, index) => {
            // 处理可能包含逗号的文本
            const safeWord = word.includes(',') ? `"${word}"` : word;
            const weight = keywordWeights[index];
            
            csvContent += `${index + 1},${safeWord},${weight.score},${weight.searchVolume},${weight.competition},${weight.clickValue}\n`;
        });
        
        // 创建Blob对象，明确指定UTF-8编码
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 设置文件名，添加时间戳避免缓存问题
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `搜索联想词分析_${timestamp}.csv`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        showToast('导出成功！');
    } catch (error) {
        console.error('导出失败:', error);
        alert(`导出失败: ${error.message}`);
    }
}

// 升级专业版
function upgradeToProVersion() {
    window.open('https://your-payment-page.com', '_blank');
}

// 添加事件监听器
getSuggestionsButton.addEventListener('click', getSuggestions);
exportToExcelButton.addEventListener('click', exportToExcel);
upgradeButton.addEventListener('click', upgradeToProVersion);
closeDetailsButton.addEventListener('click', closeKeywordDetails);
overlay.addEventListener('click', closeKeywordDetails);
copyKeywordButton.addEventListener('click', copyCurrentKeyword);

// 初始化
initialize(); 