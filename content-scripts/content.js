// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    if (request.action === "getSuggestions") {
        console.log('开始获取联想词');
        const suggestions = new Set(); // 使用Set去重
        
        try {
            if (window.location.hostname.includes('baidu.com')) {
                console.log('检测到百度搜索页面');
                
                // 方法1: 直接查找"相关搜索"区域
                // 这是最精确的方法，专门针对截图中的红框区域
                const relatedSearchBoxes = [];
                
                // 查找包含"相关搜索"标题的元素
                document.querySelectorAll('div').forEach(div => {
                    if (div.textContent.trim() === '相关搜索') {
                        console.log('找到相关搜索标题元素:', div);
                        
                        // 获取父元素，通常是包含整个相关搜索区域的容器
                        let container = div.parentElement;
                        while (container && container.tagName !== 'BODY') {
                            // 检查是否是红框区域的容器
                            if (container.querySelectorAll('a').length >= 4) {
                                relatedSearchBoxes.push(container);
                                console.log('找到相关搜索容器:', container);
                                break;
                            }
                            container = container.parentElement;
                        }
                    }
                });
                
                // 如果找到了相关搜索区域，获取其中的链接
                if (relatedSearchBoxes.length > 0) {
                    relatedSearchBoxes.forEach(box => {
                        const links = box.querySelectorAll('a');
                        console.log(`在相关搜索区域找到 ${links.length} 个链接`);
                        
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            if (text && text.length > 1 && text.length < 30) {
                                suggestions.add(text);
                            }
                        });
                    });
                } else {
                    // 方法2: 尝试查找特定类名的相关搜索区域
                    // 这些类名可能会随百度更新而变化
                    const specificContainers = document.querySelectorAll('.c-container[tpl="recommend_list"], .se-relativewords');
                    console.log('找到特定类名的相关搜索容器:', specificContainers.length);
                    
                    specificContainers.forEach(container => {
                        const links = container.querySelectorAll('a');
                        console.log(`在特定容器中找到 ${links.length} 个链接`);
                        
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            if (text && text.length > 1 && text.length < 30) {
                                suggestions.add(text);
                            }
                        });
                    });
                    
                    // 方法3: 查找页面底部的表格或列表中的链接
                    // 这通常是相关搜索区域的另一种实现方式
                    const bottomTables = document.querySelectorAll('.c-table, table');
                    bottomTables.forEach(table => {
                        // 检查表格是否在页面底部
                        const rect = table.getBoundingClientRect();
                        const isNearBottom = rect.top > (window.innerHeight * 0.6);
                        
                        if (isNearBottom) {
                            const links = table.querySelectorAll('a');
                            console.log(`在底部表格中找到 ${links.length} 个链接`);
                            
                            links.forEach(link => {
                                const text = link.textContent.trim();
                                if (text && text.length > 1 && text.length < 30) {
                                    suggestions.add(text);
                                }
                            });
                        }
                    });
                }
                
                // 方法4: 最后的尝试，查找页面底部区域中的所有链接
                if (suggestions.size === 0) {
                    console.log('尝试查找页面底部区域中的所有链接');
                    
                    // 获取页面底部区域的所有元素
                    const allElements = document.querySelectorAll('*');
                    const bottomElements = Array.from(allElements).filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.top > (window.innerHeight * 0.7) && rect.top < (window.innerHeight * 0.95);
                    });
                    
                    // 在底部元素中查找链接
                    bottomElements.forEach(el => {
                        const links = el.querySelectorAll('a');
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            if (text && text.length > 1 && text.length < 30) {
                                suggestions.add(text);
                            }
                        });
                    });
                }
                
            } else if (window.location.hostname.includes('google.com')) {
                // 获取谷歌相关搜索
                console.log('检测到谷歌搜索页面');
                
                // 获取底部相关搜索
                const relatedSearches = document.querySelectorAll('.related-searches a, .k8XOCe a');
                console.log('找到谷歌相关搜索:', relatedSearches.length);
                
                relatedSearches.forEach(link => {
                    const text = link.textContent.trim();
                    if (text && text.length > 1) {
                        suggestions.add(text);
                    }
                });
            }
            
            // 过滤掉不需要的结果
            const filteredSuggestions = Array.from(suggestions).filter(text => {
                return text && 
                       text.length > 1 && 
                       text.length < 30 && 
                       !text.includes('百度') &&
                       !text.includes('登录') &&
                       !text.includes('设置') &&
                       !text.includes('http') &&
                       !text.includes('清除') &&
                       !text.includes('搜索') &&
                       !text.includes('...') &&
                       !text.includes('下一页') &&
                       !text.includes('上一页') &&
                       !/^\d+$/.test(text); // 排除纯数字
            });
            
            console.log('找到联想词数量:', filteredSuggestions.length);
            sendResponse({ suggestions: filteredSuggestions });
        } catch (error) {
            console.error('获取联想词出错:', error);
            sendResponse({ error: error.message, suggestions: [] });
        }
        
        return true; // 保持消息通道开放，以便异步响应
    }
});

// 通知后台脚本内容脚本已加载
chrome.runtime.sendMessage({ action: "contentScriptLoaded", url: window.location.href });

console.log('联想词获取脚本已加载'); 