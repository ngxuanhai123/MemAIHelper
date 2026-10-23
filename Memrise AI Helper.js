// ==UserScript==
// @name         Memrise AI Helper - Tampermonkey
// @namespace    https://github.com
// @version      2.0
// @description  Hỗ trợ dịch tự động Memrise + Duolingo (giữ nguyên chức năng extension gốc) - Bền bỉ, chống CSP/CORS, chống race condition, cache & hỗ trợ SPA navigation
// @author       ngxuanhai123 & Claude
// @match        https://*.memrise.com/*
// @match        https://*.duolingo.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      ai-no-free.ngxuanhai123.workers.dev
// @connect      ai-free.ngxuanhai123.workers.dev
// @connect      *
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/main/Memrise%20AI%20Helper.js
// @downloadURL  https://raw.githubusercontent.com/ngxuanhai123/MemAIHelper/main/Memrise%20AI%20Helper.js
// ==/UserScript==

(function () {
    'use strict';

    // ==================== STYLES ====================
    const css = `
        /* --- POPUP / MODAL SWITCH & CONTROLS --- */
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #00b894; }
        input:checked + .slider:before { transform: translateX(24px); }
        .status-container { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #dfe6e9; border-radius: 8px; }
        .status-label { font-weight: bold; font-size: 14px; }

        /* --- CONTENT SCRIPT OVERLAY --- */
        #memrise-helper-overlay {
            position: fixed; bottom: 30px; right: 30px;
            width: 320px; min-height: 100px; resize: both; overflow: hidden; min-width: 250px;
            background-color: #ffffff; border: 1px solid #e2e8f0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 8px rgba(0, 0, 0, 0.05);
            color: #0f172a; padding: 0; border-radius: 16px;
            z-index: 2147483647;
            font-family: 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            line-height: 1.6; display: flex; flex-direction: column;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        #memrise-helper-overlay.hidden { display: none !important; }

        .overlay-header {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
            color: #64748b; background: #f8fafc; padding: 10px 15px;
            cursor: move; user-select: none; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; white-space: nowrap;
            display: flex; justify-content: space-between; align-items: center;
        }
        #overlay-refresh-btn, #overlay-settings-btn, #overlay-pick-btn {
            font-size: 18px; cursor: pointer; color: #64748b; padding: 0 6px; transition: all 0.2s ease;
        }
        #overlay-refresh-btn:hover { color: #2563eb; transform: rotate(180deg); }
        #overlay-settings-btn:hover, #overlay-pick-btn:hover { color: #2563eb; transform: scale(1.15); }

        .overlay-content-wrapper { padding: 16px; overflow-y: auto; flex-grow: 1; max-height: 400px; }
        .overlay-main-meaning { font-size: 19px; font-weight: 800; color: #059669; margin-bottom: 10px; line-height: 1.3; }
        .overlay-sub-detail { font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 10px; border-left: 4px solid #2563eb; }
        .overlay-sub-detail strong, .overlay-sub-detail b { color: #0f172a; font-weight: 700; }

        @media (prefers-color-scheme: dark) {
            #memrise-helper-overlay {
                background-color: #131d2e;
                border-color: #1e293b;
                color: #f8fafc;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            }
            .overlay-header {
                background: #090d16;
                border-bottom-color: #1e293b;
                color: #94a3b8;
            }
            .overlay-main-meaning { color: #10b981; }
            .overlay-sub-detail {
                background: #182438;
                border-left-color: #38bdf8;
                color: #cbd5e1;
            }
            .overlay-sub-detail strong, .overlay-sub-detail b { color: #f8fafc; }
        }

        /* --- PICKER MENU --- */
        .memrise-picker-menu {
            position: fixed; z-index: 2147483647; background: #2d3436; padding: 12px;
            border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.35); display: flex; flex-direction:column; gap: 8px;
            animation: fadeIn 0.2s ease;
        }
        .memrise-picker-btn {
            background: #0984e3; border: none; color: white; padding: 8px 12px;
            border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; text-align: left; transition: opacity 0.2s;
        }
        .memrise-picker-btn:hover { opacity: 0.9; }
        .memrise-picker-btn.secondary { background: #636e72; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* --- TOAST NOTIFICATION --- */
        .memrise-helper-notif {
            position: fixed; top: 25px; left: 50%; transform: translateX(-50%);
            background: #0984e3; color: #fff; padding: 12px 24px; border-radius: 50px;
            z-index: 2147483647; font-weight: 600; font-size: 14px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25); animation: slideDown 0.3s ease-out;
            pointer-events: none;
        }
        @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 25px; opacity: 1; } }
        .memrise-helper-loading { color: #b2bec3; font-style: italic; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }

        /* --- FLOATING ACTION BUTTON (FAB) --- */
        #memrise-helper-fab {
            position: fixed; bottom: 30px; right: 30px; z-index: 2147483646;
            width: 48px; height: 48px; border-radius: 50%;
            background: linear-gradient(135deg, #0984e3, #00b894);
            color: #fff; font-size: 22px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
            border: 2px solid #ffffff; user-select: none;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #memrise-helper-fab:hover { transform: scale(1.12); }
        #memrise-helper-fab:active { transform: scale(0.95); }

        /* --- SETTINGS MODAL --- */
        .memrise-config-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #ffffff; width: 330px; padding: 22px; border-radius: 16px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.25); z-index: 2147483648;
            color: #2d3436; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: fadeIn 0.2s ease;
        }
        .memrise-config-modal h2 { margin: 0 0 15px 0; font-size: 18px; color: #2d3436; display: flex; align-items: center; gap: 8px; }
        .memrise-config-modal .input-group { margin-bottom: 15px; }
        .memrise-config-modal label.field-label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; color: #636e72; }
        .memrise-config-modal input[type="text"] {
            width: 100%; padding: 10px; border: 1px solid #dfe6e9; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 13px;
        }
        .memrise-config-modal input[type="text"]:focus { border-color: #0984e3; }
        .memrise-config-modal button {
            width: 100%; padding: 11px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
            display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; transition: opacity 0.2s;
        }
        .memrise-config-modal button:hover { opacity: 0.9; }
        .memrise-config-modal #modal-saveBtn { background-color: #0984e3; color: white; margin-bottom: 15px; }
        .memrise-config-modal #modal-pickBtn { background-color: #00b894; color: white; }
        .memrise-config-modal #modal-closeBtn { background-color: #dfe6e9; color: #2d3436; margin-top: 10px; }
        .memrise-config-modal .divider { height: 1px; background: #dfe6e9; margin: 15px 0; }
        .memrise-config-modal .hint { font-size: 11px; color: #b2bec3; text-align: center; margin-top: 8px; }
    `;
    GM_addStyle(css);

    // ==================== CONSTANTS & DEFAULTS ====================
    const DEFAULT_WORKER_URL = "https://ai-no-free.ngxuanhai123.workers.dev/v1/chat/completions";
    const DEFAULT_AI_MODEL = "tranhieu13102003/gpt-6-luna";
    const DEFAULT_AUTH_KEY = "Ai@123";
    const GLOBAL_KEY = "global_domain";

    // Danh sách selectors đa dạng cho Memrise (cả modern lẫn classic) và Duolingo
    const SITE_PRESETS = {
        'memrise.com': [
            // Memrise Hiện đại (2024 - 2026: Sessions, Scenarios, Presentation, Typing, Multiple Choice)
            { type: 'single', s1: '[data-testid="prompt-sentence"]' },
            { type: 'single', s1: '[data-testid="presentation-element"]' },
            { type: 'single', s1: '[data-testid="presentation-card"]' },
            { type: 'single', s1: '[data-testid="typing-prompt"]' },
            { type: 'single', s1: '[data-testid="multiple-choice-prompt"]' },
            { type: 'single', s1: '[data-testid="word-title"]' },
            { type: 'single', s1: '[data-testid="word-presentation"]' },
            { type: 'single', s1: '[data-testid="learning-card"]' },
            { type: 'single', s1: '[data-testid="screen-card"]' },
            { type: 'single', s1: '[data-testid="prompt"]' },
            { type: 'single', s1: '[data-testid="question-text"]' },
            { type: 'single', s1: '[data-testid="test-prompt"]' },
            { type: 'single', s1: '[data-testid="source-text"]' },
            { type: 'single', s1: '[data-testid="course-word"]' },
            { type: 'single', s1: 'h2[data-testid]' },
            { type: 'single', s1: 'h1[data-testid]' },
            // Memrise Cổ điển (Community courses)
            { type: 'single', s1: '.qquestion' },
            { type: 'single', s1: '.qtitle' },
            { type: 'single', s1: '.thing .col_a' },
            { type: 'single', s1: '.highlighted-word' }
        ],
        'duolingo.com': [
            { type: 'single', s1: '[data-test="challenge-translate-prompt"]' },
            { type: 'single', s1: '[data-test="challenge-header"]' },
            { type: 'single', s1: '[data-test="hint-sentence"]' },
            { type: 'single', s1: 'h1[data-test="challenge-header"]' },
            { type: 'single', s1: '[data-test="challenge"] [data-test="hint-token"]' },
            { type: 'single', s1: '[data-test="challenge"] h1' }
        ]
    };

    // ==================== GLOBAL STATE ====================
    let isPickingMode = false;
    let pickingStep = 0;
    let savedConfigs = {};
    let workerUrl = DEFAULT_WORKER_URL;
    let lastTranslatedKey = "";
    let isExtensionActive = true;
    let tempElementSelector = null;
    let isFetching = false;
    let requestSeq = 0; // Token chống race condition khi chuyển từ vựng nhanh
    let cachedWinPos = { left: null, top: null, width: '320px', height: 'auto' };
    const translateCache = {}; // Cache trong phiên học { key: html }

    // ==================== HELPERS: SITE & STORAGE ====================
    function getSitePresets() {
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

    async function loadSettings() {
        // Đảm bảo không bao giờ bị ghi đè thành chuỗi rỗng
        const savedUrl = await GM_getValue('workerUrl', '');
        workerUrl = savedUrl && savedUrl.trim() ? savedUrl : DEFAULT_WORKER_URL;

        let configs = await GM_getValue('savedConfigs', {});
        if (configs && typeof configs === 'object') {
            for (let key in configs) {
                if (!Array.isArray(configs[key])) {
                    configs[key] = configs[key] ? [configs[key]] : [];
                }
            }
            savedConfigs = configs;
        } else {
            savedConfigs = {};
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

    // ==================== CONTEXT CONFIG (FALLBACK THÔNG MINH) ====================
    function getCurrentPath() {
        return window.location.pathname;
    }

    function getConfigsForContext() {
        const path = getCurrentPath();
        // 1. Cấu hình theo trang cụ thể
        if (savedConfigs[path] && savedConfigs[path].length > 0) {
            return savedConfigs[path];
        }
        // 2. Cấu hình chung cho domain đã lưu
        if (savedConfigs[GLOBAL_KEY] && savedConfigs[GLOBAL_KEY].length > 0) {
            return savedConfigs[GLOBAL_KEY];
        }
        // 3. Preset mặc định của site
        const presets = getSitePresets();
        if (presets && presets.length > 0) {
            return presets;
        }
        return null;
    }

    // ==================== SPA NAVIGATION HOOKS ====================
    function hookHistoryAPI() {
        const wrap = (type) => {
            const orig = history[type];
            return function (...args) {
                const res = orig.apply(this, args);
                window.dispatchEvent(new Event('helper-locationchange'));
                return res;
            };
        };
        history.pushState = wrap('pushState');
        history.replaceState = wrap('replaceState');
        window.addEventListener('popstate', () => window.dispatchEvent(new Event('helper-locationchange')));
        window.addEventListener('hashchange', () => window.dispatchEvent(new Event('helper-locationchange')));
        window.addEventListener('helper-locationchange', () => {
            lastTranslatedKey = ""; // Reset khóa dịch khi sang URL mới
            if (isExtensionActive && !isPickingMode) {
                scheduleTranslate(200);
            }
        });
    }

    // ==================== DOM & ELEMENT HELPERS ====================
    function getElementText(el) {
        if (!el) return "";
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            return el.value.trim() || el.getAttribute('placeholder') || "";
        }

        // Tạo bản sao để loại bỏ nút bấm âm thanh, icon, v.v. trước khi lấy chữ
        try {
            const clone = el.cloneNode(true);
            const uselessNodes = clone.querySelectorAll('button, svg, audio, script, style, [aria-hidden="true"]');
            uselessNodes.forEach(node => node.remove());

            const selChildren = 'p, h1, h2, h3, [data-test="hint-sentence"], [data-test="challenge-translate-prompt"], [data-testid="prompt-sentence"], span[lang]';
            const children = clone.querySelectorAll(selChildren);
            if (children.length > 0) {
                for (const child of children) {
                    const text = (child.innerText || child.textContent || "").trim();
                    if (text && text.length > 1) return text;
                }
            }
            return (clone.innerText || clone.textContent || "").trim();
        } catch (e) {
            return (el.innerText || el.textContent || "").trim();
        }
    }

    function isElementVisible(el) {
        if (!el) return false;
        if (el.offsetParent !== null) return true;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    async function findBestElement(selector, maxRetries = 4, interval = 150) {
        let retries = 0;
        return new Promise(resolve => {
            const check = () => {
                const elements = document.querySelectorAll(selector);
                if (elements.length === 0) {
                    if (retries < maxRetries) {
                        retries++;
                        setTimeout(check, interval);
                    } else {
                        resolve(null);
                    }
                    return;
                }

                // Ưu tiên 1: Đang hiển thị và có nội dung văn bản
                for (let el of elements) {
                    if (isElementVisible(el)) {
                        const text = getElementText(el);
                        if (text && text.length > 0) return resolve(el);
                    }
                }
                // Ưu tiên 2: Đang hiển thị
                for (let el of elements) {
                    if (isElementVisible(el)) return resolve(el);
                }

                if (retries < maxRetries) {
                    retries++;
                    setTimeout(check, interval);
                } else {
                    resolve(null);
                }
            };
            check();
        });
    }

    // ==================== API FETCH (GM_xmlhttpRequest VƯỢT CSP/CORS) ====================
    function apiFetch(payload) {
        return new Promise((resolve, reject) => {
            const isAiNoFree = workerUrl.includes('ai-no-free');
            let reqData = payload;
            let reqHeaders = { 'Content-Type': 'application/json' };

            if (isAiNoFree) {
                reqHeaders['Authorization'] = `Bearer ${DEFAULT_AUTH_KEY}`;
                const userPrompt = payload.engText 
                    ? `Dịch sang tiếng Việt cho từ/câu: "${payload.indoText}" (Ngữ cảnh tiếng Anh: "${payload.engText}"). Định dạng: **Nghĩa chính**, kèm theo giải thích hoặc ví dụ ngắn gọn.`
                    : `Dịch sang tiếng Việt cho từ/câu: "${payload.indoText}". Định dạng: **Nghĩa chính**, kèm theo giải thích hoặc ví dụ ngắn gọn.`;
                reqData = {
                    model: DEFAULT_AI_MODEL,
                    messages: [
                        { role: "system", content: "Bạn là trợ lý dịch thuật song ngữ cho Memrise và Duolingo. Trả về kết quả: **nghĩa chính in đậm**, bên dưới là giải thích hoặc ví dụ ngắn gọn." },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.3
                };
            }

            const parseResponse = (rawText) => {
                const parsed = JSON.parse(rawText);
                if (parsed.choices && parsed.choices.length > 0 && parsed.choices[0].message) {
                    return { result: parsed.choices[0].message.content };
                }
                return parsed;
            };

            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: workerUrl,
                    headers: reqHeaders,
                    data: JSON.stringify(reqData),
                    timeout: 20000,
                    onload: (res) => {
                        try {
                            if (res.status < 200 || res.status >= 300) {
                                if (workerUrl.includes('ai-no-free')) {
                                    const fallbackUrl = 'https://ai-free.ngxuanhai123.workers.dev/v1/chat/completions';
                                    GM_xmlhttpRequest({
                                        method: 'POST',
                                        url: fallbackUrl,
                                        headers: { 'Content-Type': 'application/json' },
                                        data: JSON.stringify(reqData),
                                        timeout: 20000,
                                        onload: (fbRes) => {
                                            if (fbRes.status >= 200 && fbRes.status < 300) {
                                                resolve(parseResponse(fbRes.responseText));
                                            } else {
                                                reject(new Error('HTTP ' + fbRes.status));
                                            }
                                        },
                                        onerror: () => reject(new Error('HTTP ' + res.status)),
                                        ontimeout: () => reject(new Error('HTTP ' + res.status))
                                    });
                                    return;
                                }
                                reject(new Error('HTTP ' + res.status));
                                return;
                            }
                            resolve(parseResponse(res.responseText));
                        } catch (e) {
                            reject(new Error('Lỗi giải mã JSON: ' + e.message));
                        }
                    },
                    onerror: (e) => reject(new Error('Lỗi kết nối API: ' + (e.statusText || e.error || 'Network error'))),
                    ontimeout: () => reject(new Error('Quá thời gian kết nối (20s)'))
                });
            } else {
                // Fallback nếu môi trường không có GM_xmlhttpRequest
                fetch(workerUrl, {
                    method: 'POST',
                    headers: reqHeaders,
                    body: JSON.stringify(reqData)
                })
                .then(res => {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.text();
                })
                .then(text => resolve(parseResponse(text)))
                .catch(reject);
            }
        });
    }

    // ==================== TRANSLATE LOGIC ====================
    function scheduleTranslate(delay = 350) {
        clearTimeout(window.translateTimer);
        window.translateTimer = setTimeout(tryTranslate, delay);
    }

    async function tryTranslate() {
        if (!workerUrl || !isExtensionActive || isPickingMode || isFetching) return;

        const configs = getConfigsForContext();
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
                if (text && text.length > 0) {
                    bestMatch = { config: cfg, el1: el, text1: text };
                    break;
                } else if (!fallbackMatch) {
                    fallbackMatch = { config: cfg, el1: el };
                }
            }
        }

        const selected = bestMatch || fallbackMatch;
        if (!selected || !bestMatch) {
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

        const currentKey = getCurrentPath() + "|" + matchedConfig.s1 + "|" + text1 + "|" + text2;
        if (lastTranslatedKey === currentKey) return;

        // Kiểm tra Cache trong phiên
        if (translateCache[currentKey]) {
            lastTranslatedKey = currentKey;
            updateOverlayContent(translateCache[currentKey]);
            return;
        }

        // Tạo seq token chống race condition
        const currentSeq = ++requestSeq;
        isFetching = true;
        updateOverlayContent(`<span class="memrise-helper-loading">⏳ Đang dịch: <b>"${text1}"</b>...</span>`);

        try {
            const data = await apiFetch({ indoText: text1, engText: text2 });
            const raw = data.result || "";

            // Parser đa năng: Hỗ trợ Markdown **, HTML <b><small>, và plain text <br>
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = raw.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

            let mainMeaning = "";
            let details = "";

            const bTag = tempDiv.querySelector('b, strong');
            const smallTag = tempDiv.querySelector('small');

            if (bTag) {
                mainMeaning = bTag.innerHTML.trim();
                if (smallTag) {
                    details = smallTag.innerHTML.trim();
                } else {
                    bTag.remove();
                    details = tempDiv.innerHTML.replace(/^(\s*<br\s*\/?>)+|(\s*<br\s*\/?>)+$/gi, '').trim();
                }
            } else {
                const lines = raw.split(/\n|<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
                mainMeaning = (lines[0] || '').replace(/<[^>]+>/g, '').trim();
                details = lines.slice(1).join('<br>').trim();
            }

            const finalHtml = `
                <div class="overlay-main-meaning">${mainMeaning || text1}</div>
                ${details ? `<div class="overlay-sub-detail">${details}</div>` : ''}
            `;

            // Chỉ cập nhật nếu đây vẫn là request mới nhất (chống race condition)
            if (currentSeq === requestSeq) {
                translateCache[currentKey] = finalHtml;
                lastTranslatedKey = currentKey;
                updateOverlayContent(finalHtml);
            }
        } catch (e) {
            console.error("[Memrise AI Helper]", e);
            if (currentSeq === requestSeq) {
                updateOverlayContent(`<span style="color:#d63031; font-size:12px">⚠️ Lỗi: ${e.message}</span>`);
            }
        } finally {
            if (currentSeq === requestSeq) {
                isFetching = false;
            }
        }
    }

    // ==================== MUTATION OBSERVER ====================
    const observer = new MutationObserver(() => {
        if (!isExtensionActive || isPickingMode) return;
        scheduleTranslate(350);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

    // ==================== OVERLAY & FAB UI ====================
    function toggleOverlayDisplay(shouldShow) {
        const overlay = document.getElementById('memrise-helper-overlay');
        const fab = document.getElementById('memrise-helper-fab');

        if (overlay) {
            overlay.classList.toggle('hidden', !shouldShow);
        }
        // Khi overlay hiện thì ẩn FAB, khi overlay ẩn thì hiện FAB để người dùng luôn mở được cài đặt
        if (fab) {
            fab.style.display = shouldShow ? 'none' : 'flex';
        }
    }

    function createOverlay() {
        let div = document.getElementById('memrise-helper-overlay');
        if (div) div.remove();

        div = document.createElement('div');
        div.id = 'memrise-helper-overlay';

        // Áp dụng vị trí và kích thước đã lưu
        if (cachedWinPos.left !== null && cachedWinPos.top !== null) {
            div.style.left = cachedWinPos.left;
            div.style.top = cachedWinPos.top;
            div.style.right = 'auto';
            div.style.bottom = 'auto';
        } else {
            div.style.right = '30px';
            div.style.bottom = '30px';
            div.style.left = 'auto';
            div.style.top = 'auto';
        }
        if (cachedWinPos.width) div.style.width = cachedWinPos.width;
        if (cachedWinPos.height) div.style.height = cachedWinPos.height;

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
                <div id="memrise-helper-content"><span style="font-size:13px; color:#b2bec3;">Sẵn sàng...</span></div>
            </div>
        `;
        document.body.appendChild(div);

        // Sự kiện các nút trên overlay
        div.querySelector('#overlay-refresh-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            lastTranslatedKey = "";
            if (!isFetching) tryTranslate();
        });

        div.querySelector('#overlay-settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showSettingsModal();
        });

        div.querySelector('#overlay-pick-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isExtensionActive) {
                showNotification("Vui lòng BẬT extension trước khi chỉ điểm.");
                return;
            }
            togglePickMode(true);
        });

        makeDraggable(div);
        makeResizable(div);
    }

    function createFAB() {
        if (document.getElementById('memrise-helper-fab')) return;
        const fab = document.createElement('div');
        fab.id = 'memrise-helper-fab';
        fab.title = "Mở cài đặt Memrise Helper";
        fab.textContent = '🧠';
        fab.addEventListener('click', () => {
            showSettingsModal();
        });
        document.body.appendChild(fab);
    }

    function makeDraggable(element) {
        const header = element.querySelector('.overlay-header');
        let isDragging = false, offsetX = 0, offsetY = 0;

        header.addEventListener('mousedown', (e) => {
            if (['overlay-settings-btn', 'overlay-pick-btn', 'overlay-refresh-btn'].includes(e.target.id)) return;
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;

            // Giới hạn trong màn hình
            left = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, left));
            top = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, top));

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'default';
                cachedWinPos.left = element.style.left;
                cachedWinPos.top = element.style.top;
                cachedWinPos.width = element.style.width;
                cachedWinPos.height = element.style.height;
                saveWinPos();
            }
        });
    }

    function makeResizable(element) {
        new ResizeObserver(() => {
            if (!element.classList.contains('hidden')) {
                cachedWinPos.width = element.style.width;
                cachedWinPos.height = element.style.height;
                saveWinPos();
            }
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
        }, 2800);
    }

    // ==================== PICKING MODE ====================
    function togglePickMode(state) {
        isPickingMode = state;
        pickingStep = state ? 1 : 0;
        if (state) {
            showNotification("🎯 CHẾ ĐỘ CHỈ ĐIỂM: Click vào từ/câu hỏi trên màn hình.");
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
        if (document.getElementById('memrise-helper-overlay') && e.target.closest('#memrise-helper-overlay')) return;

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
            if (testId && !testId.includes(' ')) return `[data-testid="${testId}"]`;

            const test = node.getAttribute('data-test');
            if (test) {
                if (!test.includes(' ')) return `[data-test="${test}"]`;
                else if (!containerFallback) containerFallback = `[data-test="${test}"]`;
            }
            node = node.parentElement;
        }

        if (containerFallback) return containerFallback;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.getAttribute('placeholder')) return `${el.tagName.toLowerCase()}[placeholder="${el.getAttribute('placeholder')}"]`;
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
        const posX = Math.min(x, window.innerWidth - 240);
        const posY = Math.min(y + 10, window.innerHeight - 160);
        menu.style.top = posY + 'px';
        menu.style.left = posX + 'px';
        menu.innerHTML = `
            <div style="margin-bottom:6px; color:#bdc3c7; font-size:11px;">Selector: <b>${tempElementSelector.substring(0, 26)}...</b></div>
            <button id="btn-pick-single" class="memrise-picker-btn">✅ Lưu phần tử này</button>
            <button id="btn-pick-pair" class="memrise-picker-btn secondary">🔗 Chọn thêm câu phụ</button>
            <button id="btn-pick-cancel" class="memrise-picker-btn secondary" style="background:#d63031">❌ Hủy</button>
        `;
        document.body.appendChild(menu);

        document.getElementById('btn-pick-single').onclick = () => {
            saveConfig({ type: 'single', s1: tempElementSelector });
            finishPicking();
        };
        document.getElementById('btn-pick-pair').onclick = () => {
            showNotification("Bước 2: Click vào phần tử câu phụ.");
            pickingStep = 2;
            removePickerMenu();
        };
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
        // Lưu vào cả trang hiện tại và cấu hình chung domain để dùng cho các bài học khác
        const path = getCurrentPath();
        if (!savedConfigs[path]) savedConfigs[path] = [];
        if (!savedConfigs[GLOBAL_KEY]) savedConfigs[GLOBAL_KEY] = [];

        const updateList = (list) => {
            const idx = list.findIndex(c => c.s1 === newConfig.s1);
            if (idx !== -1) list[idx] = newConfig;
            else list.unshift(newConfig);
        };

        updateList(savedConfigs[path]);
        updateList(savedConfigs[GLOBAL_KEY]);

        saveConfigs().then(() => {
            showNotification("✅ Đã lưu cấu hình phần tử! Đang dịch...");
            lastTranslatedKey = "";
            scheduleTranslate(100);
        });
    }

    function highlightElement(el, color) {
        const original = el.style.outline;
        el.style.outline = `3px solid ${color}`;
        setTimeout(() => el.style.outline = original, 1000);
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
                <label class="field-label" for="modal-url">Cloudflare Worker API URL</label>
                <input id="modal-url" type="text" placeholder="https://..." value="${workerUrl}">
            </div>
            <button id="modal-saveBtn">💾 Lưu Cấu Hình</button>
            <div class="divider"></div>
            <button id="modal-pickBtn">🎯 Chỉ điểm phần tử mới</button>
            <p class="hint">Click để chọn trực tiếp từ/câu hỏi trên trang web.</p>
            <button id="modal-closeBtn">Đóng</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('modal-activeToggle').checked = isExtensionActive;

        // Bật/tắt trạng thái
        document.getElementById('modal-activeToggle').addEventListener('change', (e) => {
            isExtensionActive = e.target.checked;
            GM_setValue('isActive', isExtensionActive);
            if (!isExtensionActive) {
                toggleOverlayDisplay(false);
            } else {
                createOverlay();
                scheduleTranslate(200);
            }
        });

        // Lưu URL
        document.getElementById('modal-saveBtn').addEventListener('click', () => {
            const inputVal = document.getElementById('modal-url').value.trim();
            workerUrl = inputVal || DEFAULT_WORKER_URL;
            GM_setValue('workerUrl', workerUrl);
            const btn = document.getElementById('modal-saveBtn');
            btn.textContent = "Đã lưu! ✅";
            setTimeout(() => btn.textContent = "💾 Lưu Cấu Hình", 1500);
            showNotification("Đã cập nhật URL API.");
            lastTranslatedKey = "";
            scheduleTranslate(200);
        });

        // Nút Pick
        document.getElementById('modal-pickBtn').addEventListener('click', () => {
            if (!isExtensionActive) return alert("Vui lòng BẬT extension trước khi chỉ điểm.");
            modal.remove();
            togglePickMode(true);
        });

        // Nút Đóng
        document.getElementById('modal-closeBtn').addEventListener('click', () => modal.remove());
    }

    // ==================== TAMPERMONKEY MENU COMMANDS ====================
    function registerMenuCommands() {
        try {
            if (typeof GM_registerMenuCommand !== 'undefined') {
                GM_registerMenuCommand('⚙️ Mở Cài Đặt Helper', () => showSettingsModal());
                GM_registerMenuCommand('🎯 Chỉ Điểm Phần Tử', () => {
                    if (!isExtensionActive) {
                        showNotification("Hãy bật extension trước!");
                        return;
                    }
                    togglePickMode(true);
                });
                GM_registerMenuCommand('🔁 Bật / Tắt Helper', () => {
                    isExtensionActive = !isExtensionActive;
                    GM_setValue('isActive', isExtensionActive);
                    showNotification(isExtensionActive ? "Helper đã BẬT ✅" : "Helper đã TẮT ❌");
                    toggleOverlayDisplay(isExtensionActive);
                    if (isExtensionActive) scheduleTranslate(200);
                });
            }
        } catch (e) {
            console.warn("[Memrise Helper] GM_registerMenuCommand:", e);
        }
    }

    // ==================== KHỞI ĐỘNG ====================
    async function init() {
        await loadSettings();
        createFAB();
        createOverlay();
        hookHistoryAPI();
        registerMenuCommands();

        // Mặc định ban đầu ẩn hoặc hiện theo trạng thái
        toggleOverlayDisplay(isExtensionActive);

        if (isExtensionActive) {
            scheduleTranslate(800);
        }

        console.log("[Memrise AI Helper v2.0] Loaded successfully", {
            workerUrl,
            active: isExtensionActive,
            presets: getSitePresets()?.length || 0
        });
    }

    init();
})();
