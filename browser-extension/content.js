// 内容脚本：在网页中注入密码图标

(function() {
    'use strict';

    let injectedIcon = null;

    // 创建密码图标
    function createPasswordIcon() {
        const icon = document.createElement('div');
        icon.innerHTML = '🔐';
        icon.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            z-index: 999999;
            transition: all 0.3s;
        `;
        icon.title = 'Warden 密码管理器';
        icon.addEventListener('click', () => {
            // 打开扩展弹窗
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
        return icon;
    }

    // 检测并显示图标
    function checkAndShowIcon() {
        const usernameField = document.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]');
        const passwordField = document.querySelector('input[type="password"]');

        // 如果有登录表单，显示图标
        if ((usernameField || passwordField) && !injectedIcon) {
            injectedIcon = createPasswordIcon();
            document.body.appendChild(injectedIcon);
        }
    }

    // 监听 DOM 变化
    const observer = new MutationObserver(() => {
        checkAndShowIcon();
    });

    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初始检查
    checkAndShowIcon();

    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'autofill') {
            const { username, password } = request;
            
            // 填充表单
            const usernameField = document.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]');
            const passwordField = document.querySelector('input[type="password"]');
            
            if (usernameField && username) {
                usernameField.value = username;
                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (passwordField && password) {
                passwordField.value = password;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            sendResponse({ success: true });
        }
    });

    console.log('Warden content script loaded');
})();
