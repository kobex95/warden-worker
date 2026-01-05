// 后台服务脚本

chrome.runtime.onInstalled.addListener(() => {
    console.log('Warden extension installed');
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.action.openPopup();
    }
    return true;
});

// 监听右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'warden-save',
        title: '使用 Warden 保存密码',
        contexts: ['all']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'warden-save') {
        chrome.action.openPopup();
    }
});
