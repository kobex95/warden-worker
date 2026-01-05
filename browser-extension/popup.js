// Supabase 配置
const SUPABASE_URL = 'https://jxngfaycacjetpiqttwb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nwca-b4HH9JFDInZgyrAuQ_C0wsGnhs';

// 创建 Supabase 客户端
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 状态管理
let currentUser = null;
let allCiphers = [];

// DOM 元素
const loginView = document.getElementById('loginView');
const vaultView = document.getElementById('vaultView');
const settingsView = document.getElementById('settingsView');
const vaultList = document.getElementById('vaultList');

// 初始化
async function init() {
    const storedUser = await chrome.storage.local.get('currentUser');
    if (storedUser.currentUser) {
        currentUser = storedUser.currentUser;
        showVaultTab();
        await loadVault();
    }
}

// 显示/隐藏视图
function showVaultTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    loginView.classList.add('hidden');
    vaultView.classList.remove('hidden');
    settingsView.classList.add('hidden');
}

function showSettingsTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    loginView.classList.add('hidden');
    vaultView.classList.add('hidden');
    settingsView.classList.remove('hidden');
}

// 简单哈希函数
async function simpleHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 登录处理
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const passwordHash = await simpleHash(password);
        
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('master_password_hash', passwordHash)
            .single();
        
        if (error || !user) {
            errorEl.textContent = '邮箱或密码错误';
            errorEl.classList.remove('hidden');
        } else {
            currentUser = user;
            await chrome.storage.local.set({ currentUser });
            showVaultTab();
            await loadVault();
        }
    } catch (error) {
        errorEl.textContent = '登录失败：' + error.message;
        errorEl.classList.remove('hidden');
    }
});

// 加载密码库
async function loadVault() {
    if (!currentUser) return;
    
    vaultList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const { data: ciphers, error } = await supabaseClient
            .from('ciphers')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (error) {
            vaultList.innerHTML = '<div class="error">加载失败</div>';
            return;
        }
        
        allCiphers = ciphers || [];
        renderVault(allCiphers);
    } catch (error) {
        vaultList.innerHTML = '<div class="error">加载失败</div>';
    }
}

// 渲染密码列表
function renderVault(ciphers) {
    if (!ciphers || ciphers.length === 0) {
        vaultList.innerHTML = '<div class="loading">密码库为空</div>';
        return;
    }
    
    vaultList.innerHTML = ciphers.map(cipher => {
        const cipherData = typeof cipher.data === 'string' ? JSON.parse(cipher.data) : cipher.data;
        return `
            <div class="vault-item">
                <h3>${cipherData.name || '未命名'}</h3>
                <p>${cipherData.login?.username || '无用户名'}</p>
                <div class="actions">
                    <button class="btn btn-small" onclick="copyUsername('${cipherData.login?.username || ''}')">复制用户名</button>
                    <button class="btn btn-small" onclick="copyPassword('${cipherData.login?.password || ''}')">复制密码</button>
                    <button class="btn btn-small" onclick="autofill('${cipherData.login?.username || ''}', '${cipherData.login?.password || ''}')">自动填充</button>
                </div>
            </div>
        `;
    }).join('');
}

// 搜索密码库
function searchVault() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        renderVault(allCiphers);
        return;
    }
    
    const filtered = allCiphers.filter(cipher => {
        const cipherData = typeof cipher.data === 'string' ? JSON.parse(cipher.data) : cipher.data;
        const name = (cipherData.name || '').toLowerCase();
        const username = (cipherData.login?.username || '').toLowerCase();
        return name.includes(searchTerm) || username.includes(searchTerm);
    });
    
    renderVault(filtered);
}

// 复制用户名
async function copyUsername(username) {
    if (!username) return;
    try {
        await navigator.clipboard.writeText(username);
        alert('用户名已复制');
    } catch (error) {
        alert('复制失败');
    }
}

// 复制密码
async function copyPassword(password) {
    if (!password) return;
    try {
        await navigator.clipboard.writeText(password);
        alert('密码已复制');
    } catch (error) {
        alert('复制失败');
    }
}

// 自动填充
async function autofill(username, password) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (user, pass) => {
            // 查找用户名和密码输入框
            const usernameField = document.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][id*="user"], input[type="text"][id*="email"]');
            const passwordField = document.querySelector('input[type="password"]');
            
            if (usernameField && user) {
                usernameField.value = user;
                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (passwordField && pass) {
                passwordField.value = pass;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            }
        },
        args: [username, password]
    });
}

// 保存设置
async function saveSettings() {
    const serverUrl = document.getElementById('serverUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    
    await chrome.storage.local.set({ serverUrl, apiKey });
    alert('设置已保存');
}

// 退出登录
async function logout() {
    await chrome.storage.local.clear();
    currentUser = null;
    allCiphers = [];
    showVaultTab();
    vaultList.innerHTML = '';
    loginView.classList.remove('hidden');
    vaultView.classList.add('hidden');
}

// 初始化应用
init();
