// 创建一个内联的 Base64 编码的 logo 图片
// 这是一个简单的蓝色搜索图标，适合搜索联想词获取器使用
const logoBase64 = `
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNNDE2IDIwOGMwIDQ1LjktMTQuOSA4OC4zLTQwIDEyMi43TDUwMi42IDQ1Ny40YzEyLjUgMTIuNSAxMi41IDMyLjggMCA0NS4zcy0zMi44IDEyLjUtNDUuMyAwTDMzMC43IDM3NmMtMzQuNCgyNS4yLTc2LjggNDAtMTIyLjcgNDBDOTMuMSA0MTYgMCAzMjIuOSAwIDIwOFM5My4xIDAgMjA4IDBTNDE2IDkzLjEgNDE2IDIwOHpNMjA4IDM1MmM3OS41IDAgMTQ0LTY0LjUgMTQ0LTE0NHMtNjQuNS0xNDQtMTQ0LTE0NFM2NCA5My41IDY0IDE3M3M2NC41IDE0NCAxNDQgMTQ0eiIvPjwvc3ZnPg==
`;

// 创建一个函数来设置 logo
function setLogo() {
    // 获取所有 logo 图片元素
    const logoElements = document.querySelectorAll('img.logo');
    
    // 设置 logo 图片源
    logoElements.forEach(img => {
        img.src = logoBase64;
        img.onerror = () => {
            console.error('Logo 加载失败，使用备用方案');
            // 如果 Base64 加载失败，使用内联 SVG
            const container = img.parentElement;
            const svgElement = document.createElement('div');
            svgElement.className = 'logo-svg';
            svgElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32" fill="#ffffff">
                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352c79.5 0 144-64.5 144-144s-64.5-144-144-144S64 93.5 64 173s64.5 144 144 144z"/>
                </svg>
            `;
            container.replaceChild(svgElement, img);
        };
    });
}

// 当 DOM 加载完成后设置 logo
document.addEventListener('DOMContentLoaded', setLogo); 