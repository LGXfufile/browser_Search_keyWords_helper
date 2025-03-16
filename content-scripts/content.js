// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);
    
    if (request.action === "getSuggestions") {
        console.log('开始获取联想词');
        const suggestions = new Set(); // 使用Set去重
        
        try {
            if (window.location.hostname.includes('baidu.com')) {
                console.log('检测到百度搜索页面');
                
                // 获取百度相关搜索区域的链接
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
                    // 尝试查找特定类名的相关搜索区域
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
                }
                
            } else if (window.location.hostname.includes('google.com')) {
                console.log('检测到谷歌搜索页面');
                
                // 专门获取左下角"用户还搜索了"区域 (图中红框区域)
                let foundRelatedSearches = false;
                
                // 方法1: 直接获取"用户还搜索了"区域
                const userSearchedSection = document.querySelector('.bNg8Rb');
                
                if (userSearchedSection) {
                    console.log('找到"用户还搜索了"区域 (方法1)');
                    const links = userSearchedSection.querySelectorAll('a');
                    console.log(`找到链接: ${links.length}`);
                    
                    if (links.length > 0) {
                        foundRelatedSearches = true;
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            if (text && text.length > 1 && text.length < 50) {
                                suggestions.add(text);
                            }
                        });
                    }
                }
                
                // 方法2: 查找包含"用户还搜索了"文本的区域
                if (!foundRelatedSearches) {
                    console.log('尝试方法2');
                    document.querySelectorAll('div, h3, h4, span').forEach(el => {
                        if (el.textContent.includes('用户还搜索了') || 
                            el.textContent.includes('People also search for') || 
                            el.textContent.includes('Related searches')) {
                            
                            console.log('找到包含"用户还搜索了"文本的元素:', el);
                            
                            // 获取父容器
                            let container = el;
                            for (let i = 0; i < 5; i++) { // 向上查找最多5层
                                if (container.querySelectorAll('a').length >= 2) {
                                    break;
                                }
                                if (container.parentElement) {
                                    container = container.parentElement;
                                } else {
                                    break;
                                }
                            }
                            
                            // 获取容器中的链接
                            const links = container.querySelectorAll('a');
                            console.log(`在容器中找到 ${links.length} 个链接`);
                            
                            if (links.length > 0) {
                                foundRelatedSearches = true;
                                links.forEach(link => {
                                    const text = link.textContent.trim();
                                    if (text && text.length > 1 && text.length < 50) {
                                        suggestions.add(text);
                                    }
                                });
                            }
                        }
                    });
                }
                
                // 方法3: 查找页面底部的相关搜索区域
                if (!foundRelatedSearches) {
                    console.log('尝试方法3');
                    // 获取页面底部区域的元素
                    const allElements = Array.from(document.querySelectorAll('*'));
                    const bottomElements = allElements.filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.top > (window.innerHeight * 0.6) && rect.top < (window.innerHeight * 0.95);
                    });
                    
                    // 在底部元素中查找可能的相关搜索区域
                    for (const el of bottomElements) {
                        if (el.tagName === 'DIV' && el.querySelectorAll('a').length >= 3) {
                            const links = el.querySelectorAll('a');
                            console.log(`在底部区域找到 ${links.length} 个链接`);
                            
                            if (links.length > 0) {
                                foundRelatedSearches = true;
                                links.forEach(link => {
                                    const text = link.textContent.trim();
                                    if (text && text.length > 1 && text.length < 50 && 
                                        !text.includes('http') && !text.includes('www.')) {
                                        suggestions.add(text);
                                    }
                                });
                                break; // 找到一个合适的区域后停止
                            }
                        }
                    }
                }
                
                // 方法4: 查找特定类名的元素
                if (!foundRelatedSearches) {
                    console.log('尝试方法4');
                    const possibleContainers = document.querySelectorAll('.bNg8Rb, .card-section, .ULSxyf, .X7NTVe, .tF2Cxc');
                    
                    for (const container of possibleContainers) {
                        const links = container.querySelectorAll('a');
                        if (links.length >= 2) {
                            console.log(`在特定类名容器中找到 ${links.length} 个链接`);
                            
                            foundRelatedSearches = true;
                            links.forEach(link => {
                                const text = link.textContent.trim();
                                if (text && text.length > 1 && text.length < 50) {
                                    suggestions.add(text);
                                }
                            });
                            break;
                        }
                    }
                }
                
                // 方法5: 直接获取图片中红框区域的内容
                if (!foundRelatedSearches) {
                    console.log('尝试方法5 - 获取红框区域');
                    
                    // 获取所有可能包含搜索建议的容器
                    const searchContainers = [];
                    
                    // 查找所有可能的容器
                    document.querySelectorAll('div').forEach(div => {
                        // 检查是否有足够的链接
                        const links = div.querySelectorAll('a');
                        if (links.length >= 4 && links.length <= 10) {
                            // 检查位置是否在页面底部左侧
                            const rect = div.getBoundingClientRect();
                            if (rect.top > (window.innerHeight * 0.5) && 
                                rect.left < (window.innerWidth * 0.5)) {
                                searchContainers.push(div);
                            }
                        }
                    });
                    
                    console.log(`找到 ${searchContainers.length} 个可能的搜索容器`);
                    
                    // 处理找到的容器
                    if (searchContainers.length > 0) {
                        // 优先选择最接近左下角的容器
                        searchContainers.sort((a, b) => {
                            const rectA = a.getBoundingClientRect();
                            const rectB = b.getBoundingClientRect();
                            const distanceA = Math.sqrt(Math.pow(rectA.left, 2) + Math.pow(window.innerHeight - rectA.bottom, 2));
                            const distanceB = Math.sqrt(Math.pow(rectB.left, 2) + Math.pow(window.innerHeight - rectB.bottom, 2));
                            return distanceA - distanceB;
                        });
                        
                        const bestContainer = searchContainers[0];
                        const links = bestContainer.querySelectorAll('a');
                        
                        console.log(`在最佳容器中找到 ${links.length} 个链接`);
                        foundRelatedSearches = true;
                        
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            if (text && text.length > 1 && text.length < 50) {
                                suggestions.add(text);
                            }
                        });
                    }
                }
            }
            
            // 如果没有找到任何联想词，尝试更通用的方法
            if (suggestions.size === 0) {
                console.log('尝试通用方法获取联想词');
                
                // 查找页面上所有可能的搜索建议
                const allLinks = document.querySelectorAll('a');
                const searchTerms = new Set();
                
                // 获取当前搜索词
                const currentSearchTerm = document.querySelector('input[name="q"]')?.value || '';
                console.log('当前搜索词:', currentSearchTerm);
                
                // 查找所有链接
                allLinks.forEach(link => {
                    const href = link.href || '';
                    const text = link.textContent.trim();
                    
                    // 检查是否是搜索链接
                    if ((href.includes('/search?') || href.includes('&q=') || href.includes('?q=')) && 
                        text && text.length > 1 && text.length < 50 && 
                        !text.includes('http') && !text.includes('www.')) {
                        searchTerms.add(text);
                    }
                });
                
                // 添加到建议中
                searchTerms.forEach(term => suggestions.add(term));
            }
            
            // 过滤掉不需要的结果
            const filteredSuggestions = Array.from(suggestions).filter(text => {
                return text && 
                       text.length > 1 && 
                       text.length < 50 && 
                       !text.includes('http') &&
                       !text.includes('www.') &&
                       !text.includes('清除') &&
                       !text.includes('搜索') &&
                       !text.includes('...') &&
                       !text.includes('下一页') &&
                       !text.includes('上一页') &&
                       !/^\d+$/.test(text); // 排除纯数字
            }).slice(0, 10); // 限制最多返回10个联想词，适合两列布局显示
            
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