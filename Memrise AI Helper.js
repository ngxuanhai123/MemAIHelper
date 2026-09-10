// ==UserScript==
// @name         Memrise AI Helper - Tampermonkey
// @namespace    https://github.com
// @version      1.2
// @description  Hỗ trợ dịch tự động Memrise + Duolingo (giữ nguyên chức năng extension gốc)
// @author       Converted by Grok
// @match        https://*.memrise.com/*
// @match        https://*.duolingo.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/refs/heads/main/Memrise%20AI%20Helper.js
// @downloadURL  https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/refs/heads/main/Memrise%20AI%20Helper.js
// ==/UserScript==

(function () {
    'use strict';

    // ==================== STYLES (styles.css + popup styles) ====================
    const css = `
        /* --- POPUP STYLES --- */
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #00b894; }
        input:checked + .slider:before { transform: translateX(24px); }
        .status-container { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #dfe6e9; border-radius: 8px; }
        .status-label { font-weight: bold; font-size: 14px; }

        /* --- CONTENT SCRIPT STYLES --- */
        #memrise-helper-overlay {
            position: fixed; bottom: 30px; right: 30px;
            width: 320px; min-height: 100px; resize: both; overflow: hidden; min-width: 250px;
            background-color: #ffffff; border: 1px solid #e0e0e0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06);
            color: #2d3436; padding: 0; border-radius: 16px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            line-height: 1.6; display: flex; flex-direction: column;
            transition: opacity 0.2s ease;
        }
        #memrise-helper-overlay.hidden { display: none !important; }

        .overlay-header {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            color: #b2bec3; background: #f1f2f6; padding: 8px 15px;
            cursor: move; user-select: none; border-bottom: 1px solid #dfe6e9; flex-shrink: 0; white-space: nowrap;
            display: flex; justify-content: space-between; align-items: center;
        }
        #overlay-refresh-btn, #overlay-settings-btn, #overlay-pick-btn {
            font-size: 18px; cursor: pointer; color: #b2bec3; padding: 0 6px; transition: all 0.3s ease;
        }
        #overlay-refresh-btn:hover { color: #0984e3; transform: rotate(180deg); }
        #overlay-settings-btn:hover, #overlay-pick-btn:hover { color: #0984e3; }

        .overlay-content-wrapper { padding: 20px; overflow-y: auto; flex-grow: 1; }
        .overlay-main-meaning { font-size: 20px; font-weight: 800; color: #00b894; margin-bottom: 15px; line-height: 1.3; }
        .overlay-sub-detail { font-size: 13px; color: #636e72; background: #f8f9fa; padding: 12px; border-radius: 10px; border-left: 4px solid #fdcb6e; }
        .overlay-sub-detail strong { color: #2d3436; font-weight: 700; }

        .memrise-picker-menu {
            position: fixed; z-index: 2147483647; background: #2d3436; padding: 10px;
            border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); display: flex; flex-direction:column; gap: 8px;
            animation: fadeIn 0.2s ease;
        }
        .memrise-picker-btn {
            background: #0984e3; border: none; color: white; padding: 8px 12px;
            border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; text-align: left;
        }
        .memrise-picker-btn:hover { opacity: 0.9; }
        .memrise-picker-btn.secondary { background: #636e72; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .memrise-helper-notif {
            position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
            background: #0984e3; color: #fff; padding: 12px 24px; border-radius: 50px;
            z-index: 2147483647; font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 30px; opacity: 1; } }
        .memrise-helper-loading { color: #b2bec3; font-style: italic; font-size: 14px; }

        /* Popup-style cho modal */
        .memrise-config-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #f8f9fa; width: 320px; padding: 20px; border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 2147483648;
            color: #2d3436; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .memrise-config-modal h2 { margin: 0 0 15px 0; font-size: 18px; color: #2d3436; }
        .memrise-config-modal .input-group { margin-bottom: 15px; }
        .memrise-config-modal label.field-label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 12px; color: #636e72; }
        .memrise-config-modal input[type="text"] {
            width: 100%; padding: 10px; border: 1px solid #dfe6e9; border-radius: 8px; box-sizing: border-box; outline: none;
        }
        .memrise-config-modal input[type="text"]:focus { border-color: #0984e3; }
        .memrise-config-modal button {
            width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
            display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s;
        }
        .memrise-config-modal button:hover { opacity: 0.9; }
        .memrise-config-modal #modal-saveBtn { background-color: #0984e3; color: white; margin-bottom: 20px; }
        .memrise-config-modal #modal-pickBtn { background-color: #00b894; color: white; }
        .memrise-config-modal .divider { height: 1px; background: #dfe6e9; margin: 15px 0; }
        .memrise-config-modal .hint { font-size: 11px; color: #b2bec3; text-align: center; margin-top: 8px; }
    `;
    GM_addStyle(css);

    // ==================== BIẾN TOÀN CỤC ====================
    let isPickingMode = false;
    let pickingStep = 0;
    let savedConfigs = {};
    let workerUrl = "https://add-tuvung.ngxuanhai123.workers.dev/";
    let lastTranslatedKey = "";
    let isExtensionActive = true;
    let tempElementSelector = null;
    let currentUrlPath = window.location.pathname;
    let isFetching = false;
    let cachedWinPos = { left: '30px', top: '30px', width: '320px', height: 'auto' };

    const SITE_PRESETS = {
        'duolingo.com': [
            { type: 'single', s1: '[data-test="challenge-translate-prompt"]' },
            { type: 'single', s1: '[data-test="challenge-header"]' },
            { type: 'single', s1: '[data-test="hint-sentence"]' },
            { type: 'single', s1: 'h1[data-test="challenge-header"]' },
            { type: 'single', s1: '[data-test="challenge"] [data-test="hint-token"]' },
            { type: 'single', s1: '[data-test="challenge"] h1' },
        ]
    };

    function getPresetConfigs() {
        const hostname = window.location.hostname;
        for (const domain in SITE_PRESETS) {
            if (hostname.includes(domain)) return SITE_PRESETS[domain];
        }
        return null;
    }

    function getSiteTitle() {
        const hostname = window.location.hostname;
        if (hostname.includes('duolingo.com')) return '🦜 Duolingo Helper';
        if (hostname.includes('memrise.com')) return '🧠 Memrise Helper';
        return '📖 Language Helper';
    }

    // ==================== STORAGE GM ====================
    async function loadSettings() {
        workerUrl = await GM_getValue('workerUrl', '');
        let configs = await GM_getValue('savedConfigs', {});
        if (typeof configs === 'object' && configs !== null) {
            for (let key in configs) {
                if (!Array.isArray(configs[key])) {
                    configs[key] = configs[key] ? [configs[key]] : [];
                }
            }
            savedConfigs = configs;
        }
        cachedWinPos = await GM_getValue('winPos', cachedWinPos);
        isExtensionActive = await GM_getValue('isActive', true);
    }

    async function saveConfigs() {
        await GM_setValue('savedConfigs', savedConfigs);
    }

    async function saveWinPos() {
        await GM_setValue('winPos', cachedWinPos);
    }

    // ==================== UTILS ====================
    function getCurrentContextKey() {
        return window.location.pathname;
    }

    function getElementText(el) {
        if (!el) return "";
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            return el.value.trim() || el.getAttribute('placeholder') || "";
        }
        const children = el.querySelectorAll('p, h1, h2, h3, [data-test="hint-sentence"], [data-test="challenge-translate-prompt"], span[lang]');
        if (children.length > 0) {
            for (const child of children) {
                const t = child.innerText?.trim() || child.textContent?.trim();
                if (t && t.length > 2) return t;
            }
        }
        return el.innerText.trim() || el.textContent.trim();
    }

    function isElementVisible(el) {
        if (!el) return false;
        if (el.offsetParent !== null) return true;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    async function findBestElement(selector, maxRetries = 5, interval = 200) {
        let retries = 0;
        return new Promise(resolve => {
            const check = () => {
                const els = document.querySelectorAll(selector);
                if (els.length === 0) {
                    if (retries < maxRetries) {
                        retries++;
                        setTimeout(check, interval);
                    } else resolve(null);
                    return;
                }
                for (let el of els) {
                    if (isElementVisible(el)) {
                        const text = getElementText(el);
                        if (text.length > 0) return resolve(el);
                    }
                }
                for (let el of els) if (isElementVisible(el)) return resolve(el);
                if (retries < maxRetries) {
                    retries++;
                    setTimeout(check, interval);
                } else resolve(null);
            };
            check();
        });
    }

    // ==================== PICKING MODE ====================
    function togglePickMode(state) {
        isPickingMode = state;
        pickingStep = state ? 1 : 0;
        if (state) {
            showNotification("CHẾ ĐỘ CHỈ ĐIỂM: Click vào từ/câu hỏi.");
            document.body.style.cursor = "crosshair";
            toggleOverlayDisplay(true);
        } else {
            removePickerMenu();
            document.body.style.cursor = "default";
        }
    }

    document.addEventListener('click', (e) => {
        if (!isExtensionActive || !isPickingMode) return;
        if (document.getElementById('memrise-picker-menu') && e.target.closest('#memrise-picker-menu')) return;

        e.preventDefault();
        e.stopPropagation();

        const targetEl = e.target;
        highlightElement(targetEl, '#d63031');

        const selector = generateSmartSelector(targetEl);

        if (pickingStep === 1) {
            tempElementSelector = selector;
            showPickerMenu(e.clientX, e.clientY);
        } else if (pickingStep === 2) {
            saveConfig({ type: 'pair', s1: tempElementSelector, s2: selector });
            finishPicking();
        }
    }, true);

    function generateSmartSelector(el) {
        let node = el;
        let containerFallback = null;
        while (node && node !== document.body) {
            const testId = node.getAttribute('data-testid');
            if (testId) return `[data-testid="${testId}"]`;

            const test = node.getAttribute('data-test');
            if (test) {
                if (!test.includes(' ')) return `[data-test="${test}"]`;
                else if (!containerFallback) containerFallback = `[data-test="${test}"]`;
            }
            node = node.parentElement;
        }
        if (containerFallback) {
            console.warn("[Picker] Chỉ tìm được container:", containerFallback);
            return containerFallback;
        }
        // fallback class/tag
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.getAttribute('placeholder')) return `${el.tagName}[placeholder="${el.getAttribute('placeholder')}"]`;
        }
        let validClass = "";
        if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(/\s+/).filter(c => c.length > 2 && !/\d/.test(c) && !/^sc-/.test(c));
            if (classes.length) validClass = "." + classes.join('.');
        }
        if (validClass) return `${el.tagName.toLowerCase()}${validClass}`;
        return el.tagName.toLowerCase();
    }

    function showPickerMenu(x, y) {
        removePickerMenu();
        const menu = document.createElement('div');
        menu.id = 'memrise-picker-menu';
        menu.className = 'memrise-picker-menu';
        const posX = Math.min(x, window.innerWidth - 220);
        const posY = Math.min(y + 10, window.innerHeight - 150);
        menu.style.top = posY + 'px';
        menu.style.left = posX + 'px';
        menu.innerHTML = `
            <div style="margin-bottom:5px; color:#bdc3c7; font-size:11px;">Selector: ${tempElementSelector.substring(0,20)}...</div>
            <button id="btn-pick-single" class="memrise-picker-btn">✅ Lưu (Chế độ này)</button>
            <button id="btn-pick-pair" class="memrise-picker-btn secondary">🔗 Chọn thêm câu phụ</button>
            <button id="btn-pick-cancel" class="memrise-picker-btn secondary" style="background:#d63031">❌ Hủy</button>
        `;
        document.body.appendChild(menu);

        document.getElementById('btn-pick-single').onclick = () => { saveConfig({ type: 'single', s1: tempElementSelector }); finishPicking(); };
        document.getElementById('btn-pick-pair').onclick = () => { showNotification("Bước 2: Click vào phần tử phụ"); pickingStep = 2; removePickerMenu(); };
        document.getElementById('btn-pick-cancel').onclick = finishPicking;
    }

    function removePickerMenu() {
        const old = document.getElementById('memrise-picker-menu');
        if (old) old.remove();
    }

    function finishPicking() {
        isPickingMode = false;
        pickingStep = 0;
        tempElementSelector = null;
        document.body.style.cursor = "default";
        removePickerMenu();
    }

    function saveConfig(newConfig) {
        const contextKey = getCurrentContextKey();
        if (!savedConfigs[contextKey]) savedConfigs[contextKey] = [];
        const list = savedConfigs[contextKey];
        const idx = list.findIndex(c => c.s1 === newConfig.s1);
        if (idx !== -1) list[idx] = newConfig;
        else list.push(newConfig);

        saveConfigs().then(() => {
            showNotification("✅ Đã lưu! Đang xử lý...");
            lastTranslatedKey = "";
            setTimeout(tryTranslate, 500);
        });
    }

    function highlightElement(el, color) {
        const original = el.style.outline;
        el.style.outline = `3px solid ${color}`;
        setTimeout(() => el.style.outline = original, 1000);
    }

    // ==================== OVERLAY ====================
    function toggleOverlayDisplay(shouldShow) {
        const overlay = document.getElementById('memrise-helper-overlay');
        if (!overlay) return;
        if (shouldShow) {
            overlay.classList.remove('hidden');
            if (cachedWinPos.width) overlay.style.width = cachedWinPos.width;
            if (cachedWinPos.height) overlay.style.height = cachedWinPos.height;
        } else {
            overlay.classList.add('hidden');
        }
    }

    function createOverlay(posData) {
        let div = document.getElementById('memrise-helper-overlay');
        if (div) div.remove();

        div = document.createElement('div');
        div.id = 'memrise-helper-overlay';
        if (posData) {
            div.style.left = posData.left;
            div.style.top = posData.top;
            div.style.width = posData.width;
            div.style.height = posData.height;
        }

        div.innerHTML = `
            <div class="overlay-header">
                <span>${getSiteTitle()}</span>
                <div style="display:flex; gap:10px; align-items:center;">
                    <span id="overlay-settings-btn" title="Cài đặt">⚙️</span>
                    <span id="overlay-pick-btn" title="Chỉ điểm phần tử">🎯</span>
                    <span id="overlay-refresh-btn" title="Làm mới">↻</span>
                </div>
            </div>
            <div class="overlay-content-wrapper">
                <div id="memrise-helper-content"><span style="font-size:13px">Sẵn sàng...</span></div>
            </div>
        `;
        document.body.appendChild(div);

        // Refresh
        div.querySelector('#overlay-refresh-btn').addEventListener('click', e => {
            e.stopPropagation();
            lastTranslatedKey = "";
            if (!isFetching) tryTranslate();
        });

        // Settings
        div.querySelector('#overlay-settings-btn').addEventListener('click', e => {
            e.stopPropagation();
            showSettingsModal();
        });

        // Pick
        div.querySelector('#overlay-pick-btn').addEventListener('click', e => {
            e.stopPropagation();
            if (!isExtensionActive) {
                alert("Vui lòng bật extension trước khi chỉ điểm.");
                return;
            }
            togglePickMode(true);
        });

        makeDraggable(div);
        makeResizable(div);
    }

    function makeDraggable(element) {
        const header = element.querySelector('.overlay-header');
        let isDragging = false, offsetX, offsetY;

        header.addEventListener('mousedown', e => {
            if (['overlay-settings-btn','overlay-pick-btn','overlay-refresh-btn'].includes(e.target.id)) return;
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            e.preventDefault();
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'default';
                saveWinPos();
            }
        });
    }

    function makeResizable(element) {
        new ResizeObserver(() => {
            if (!element.classList.contains('hidden')) saveWinPos();
        }).observe(element);
    }

    function updateOverlayContent(html) {
        const el = document.getElementById('memrise-helper-content');
        if (el) el.innerHTML = html;
    }

    function showNotification(msg) {
        const notif = document.createElement('div');
        notif.className = 'memrise-helper-notif';
        notif.innerText = msg;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    // ==================== SETTINGS MODAL ====================
    function showSettingsModal() {
        let modal = document.getElementById('memrise-config-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'memrise-config-modal';
        modal.className = 'memrise-config-modal';
        modal.innerHTML = `
            <h2>⚙️ Cài đặt Helper</h2>
            <div class="status-container">
                <span class="status-label">Trạng thái hoạt động:</span>
                <label class="switch">
                    <input type="checkbox" id="modal-activeToggle">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="divider"></div>
            <div class="input-group">
                <label class="field-label" for="modal-url">Cloudflare Worker URL</label>
                <input id="modal-url" type="text" placeholder="https://...">
            </div>
            <button id="modal-saveBtn">💾 Lưu Cấu Hình</button>
            <div class="divider"></div>
            <button id="modal-pickBtn">🎯 Chỉ điểm phần tử</button>
            <p class="hint">Bật extension trước khi dùng tính năng này.</p>
            <button id="modal-closeBtn" style="background:#d63031;color:white;margin-top:15px;">Đóng</button>
        `;
        document.body.appendChild(modal);

        // Load giá trị hiện tại
        document.getElementById('modal-activeToggle').checked = isExtensionActive;
        document.getElementById('modal-url').value = workerUrl || '';

        // Toggle active
        document.getElementById('modal-activeToggle').addEventListener('change', e => {
            isExtensionActive = e.target.checked;
            GM_setValue('isActive', isExtensionActive);
            if (!isExtensionActive) toggleOverlayDisplay(false);
            else tryTranslate();
        });

        // Save URL
        document.getElementById('modal-saveBtn').addEventListener('click', () => {
            const url = document.getElementById('modal-url').value.trim();
            if (!url) return alert("Vui lòng nhập URL!");
            workerUrl = url;
            GM_setValue('workerUrl', url);
            const btn = document.getElementById('modal-saveBtn');
            btn.textContent = "Đã lưu! ✅";
            setTimeout(() => btn.textContent = "💾 Lưu Cấu Hình", 1500);
            updateOverlayContent("Đã cập nhật URL API.");
        });

        // Pick từ modal
        document.getElementById('modal-pickBtn').addEventListener('click', () => {
            if (!isExtensionActive) return alert("Vui lòng BẬT extension trước khi chỉ điểm.");
            togglePickMode(true);
            modal.remove();
        });

        // Close
        document.getElementById('modal-closeBtn').addEventListener('click', () => modal.remove());
    }

    // ==================== TRANSLATE LOGIC ====================
    const observer = new MutationObserver(() => {
        if (!isExtensionActive) return;
        clearTimeout(window.translateTimer);
        window.translateTimer = setTimeout(tryTranslate, 400);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

    async function tryTranslate() {
        if (!workerUrl || !isExtensionActive || isPickingMode || isFetching) return;

        const contextKey = getCurrentContextKey();
        let configs = savedConfigs[contextKey];
        if (!configs || !Array.isArray(configs) || configs.length === 0) {
            configs = getPresetConfigs();
        }
        if (!configs || !Array.isArray(configs) || configs.length === 0) {
            toggleOverlayDisplay(false);
            return;
        }

        let bestMatch = null;
        let fallbackMatch = null;

        for (const cfg of configs) {
            const el = await findBestElement(cfg.s1);
            if (el) {
                const text = getElementText(el);
                if (text) {
                    bestMatch = { config: cfg, el1: el, text1: text };
                    break;
                } else if (!fallbackMatch) {
                    fallbackMatch = { config: cfg, el1: el };
                }
            }
        }

        const selected = bestMatch || fallbackMatch;
        if (!selected) {
            toggleOverlayDisplay(false);
            return;
        }
        if (!bestMatch && fallbackMatch) {
            toggleOverlayDisplay(false);
            return;
        }

        toggleOverlayDisplay(true);

        let text1 = selected.text1;
        let text2 = "";
        const matchedConfig = selected.config;

        if (matchedConfig.type === 'pair') {
            const el2 = await findBestElement(matchedConfig.s2);
            if (el2) text2 = getElementText(el2);
        }

        const currentKey = contextKey + "|" + matchedConfig.s1 + "|" + text1 + "|" + text2;
        if (lastTranslatedKey === currentKey) return;

        isFetching = true;
        updateOverlayContent(`<span class="memrise-helper-loading">Đang dịch...</span>`);

        try {
            const res = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ indoText: text1, engText: text2 })
            });
            if (!res.ok) throw new Error("Lỗi API");
            const data = await res.json();
            const raw = data.result || "";

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = raw;
            const bTag = tempDiv.querySelector('b');
            const smallTag = tempDiv.querySelector('small');

            let mainMeaning = bTag ? bTag.innerHTML : raw.split('<br>')[0].replace(/<\/?[^>]+(>|$)/g, "");
            let details = smallTag ? smallTag.innerHTML : (raw.split('<br>').slice(1).join('<br>') || "");

            const finalHtml = `
                <div class="overlay-main-meaning">${mainMeaning}</div>
                ${details ? `<div class="overlay-sub-detail">${details}</div>` : ''}
            `;
            updateOverlayContent(finalHtml);
            lastTranslatedKey = currentKey;
        } catch (e) {
            console.error(e);
            updateOverlayContent(`<span style="color:red; font-size:11px">Lỗi: ${e.message}</span>`);
        } finally {
            isFetching = false;
        }
    }

    // ==================== KHỞI ĐỘNG ====================
    async function init() {
        await loadSettings();
        createOverlay(cachedWinPos);
        toggleOverlayDisplay(false);
        setTimeout(tryTranslate, 1000);
        console.log("[Memrise AI Tampermonkey] Loaded successfully");
    }

    init();
})();

