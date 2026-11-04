const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');

let mainWindow;

const REALISTIC_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const translations = {
    ru: {
        initAnalyze: "🚀 Запуск каскадного анализа...",
        noIds: "❌ В тексте не найдено чисел, похожих на ID.",
        foundPotential: "📋 Найдено потенциальных ID: {count}",
        analyzing: "🔎 Анализ объекта {id}...",
        collFoundApi: "   ✅ [API] Обнаружена коллекция. Дочерних элементов: {count}",
        collFoundDom: "   ✅ [DOM] Обнаружена коллекция. Дочерних элементов: {count}",
        collFoundRegex: "   ✅ [Regex] Обнаружена коллекция. Дочерних элементов: {count}",
        failApi: "   ⚠️ [API] Не удалось. Пробуем DOM...",
        failDom: "   ⚠️ [DOM] Не удалось. Пробуем Regex...",
        failRegex: "   ⚠️ [Regex] Не удалось. Считаем одиночным модом.",
        queueEmpty: "⚠️ Очередь загрузки пуста.",
        finalQueue: "📦 Итоговая очередь: {count} модов.",
        skippedItems: "🧹 Отфильтровано {count} объектов (не моды или удалены).",
        reqSizes: "📏 Запрос размеров файлов у Steam API...",
        totalSize: "📊 Общий вес всех модов: {size} GB",
        downloading: "📦 Скачивание {id} ({size})...",
        downloaded: "✅ Мод {id} готов.",
        allDone: "🎉 ВСЕ МОДЫ УСПЕШНО СКАЧАНЫ!",
        noSteamCmd: "❌ Не найден steamcmd.exe по пути: {path}",
        unknownSize: "размер неизвестен",
        resultPath: "📁 Результат: {path}"
    },
    en: {
        initAnalyze: "🚀 Starting cascading analysis...",
        noIds: "❌ No IDs found in the text.",
        foundPotential: "📋 Found potential IDs: {count}",
        analyzing: "🔎 Analyzing object {id}...",
        collFoundApi: "   ✅ [API] Collection detected. Child items: {count}",
        collFoundDom: "   ✅ [DOM] Collection detected. Child items: {count}",
        collFoundRegex: "   ✅ [Regex] Collection detected. Child items: {count}",
        failApi: "   ⚠️ [API] Failed. Trying DOM...",
        failDom: "   ⚠️ [DOM] Failed. Trying Regex...",
        failRegex: "   ⚠️ [Regex] Failed. Treating as single mod.",
        queueEmpty: "⚠️ Download queue is empty.",
        finalQueue: "📦 Final queue: {count} mods.",
        skippedItems: "🧹 Filtered out {count} items (not mods or deleted).",
        reqSizes: "📏 Requesting file sizes from Steam API...",
        totalSize: "📊 Total size of all mods: {size} GB",
        downloading: "📦 Downloading {id} ({size})...",
        downloaded: "✅ Mod {id} is ready.",
        allDone: "🎉 ALL MODS SUCCESSFULLY DOWNLOADED!",
        noSteamCmd: "❌ steamcmd.exe not found at: {path}",
        unknownSize: "unknown size",
        resultPath: "📁 Result: {path}"
    },
    es: {
        initAnalyze: "🚀 Iniciando análisis en cascada...",
        noIds: "❌ No se encontraron IDs en el texto.",
        foundPotential: "📋 IDs potenciales encontrados: {count}",
        analyzing: "🔎 Analizando objeto {id}...",
        collFoundApi: "   ✅ [API] Colección detectada. Elementos hijos: {count}",
        collFoundDom: "   ✅ [DOM] Colección detectada. Elementos hijos: {count}",
        collFoundRegex: "   ✅ [Regex] Colección detectada. Elementos hijos: {count}",
        failApi: "   ⚠️ [API] Falló. Probando DOM...",
        failDom: "   ⚠️ [DOM] Falló. Probando Regex...",
        failRegex: "   ⚠️ [Regex] Falló. Tratando como mod único.",
        queueEmpty: "⚠️ La cola de descarga está vacía.",
        finalQueue: "📦 Cola final: {count} mods.",
        skippedItems: "🧹 Filtrados {count} elementos (no son mods o fueron eliminados).",
        reqSizes: "📏 Solicitando tamaños de archivo a la API de Steam...",
        totalSize: "📊 Tamaño total de todos los mods: {size} GB",
        downloading: "📦 Descargando {id} ({size})...",
        downloaded: "✅ Mod {id} está listo.",
        allDone: "🎉 ¡TODOS LOS MODS DESCARGADOS CON ÉXITO!",
        noSteamCmd: "❌ steamcmd.exe no encontrado en: {path}",
        unknownSize: "tamaño desconocido",
        resultPath: "📁 Resultado: {path}"
    }
};

function t(lang, key, replacements = {}) {
    let str = translations[lang]?.[key] || translations['en'][key] || key;
    for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return str;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 850,
        height: 820,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(async () => {
    const defaultSession = session.defaultSession;
    defaultSession.setUserAgent(REALISTIC_USER_AGENT);
    defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = REALISTIC_USER_AGENT;
        details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9,ru;q=0.8,es;q=0.7';
        callback({ requestHeaders: details.requestHeaders });
    });
    createWindow();
});

// ---------- Утилиты ----------
function extractPotentialIds(inputText) {
    const regex = /\b\d{5,20}\b/g;
    const matches = inputText.match(regex);
    return matches ? [...new Set(matches)] : [];
}

async function getDirSize(dirPath) {
    let size = 0;
    try {
        const files = await fs.promises.readdir(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isFile()) size += stats.size;
            else if (stats.isDirectory()) size += await getDirSize(filePath);
        }
    } catch (e) { }
    return size;
}

// ---------- API ----------
function getModSizes(modIds) {
    return new Promise((resolve) => {
        const modSizes = {};
        const chunks = [];
        for (let i = 0; i < modIds.length; i += 100) chunks.push(modIds.slice(i, i + 100));

        let completedChunks = 0;
        if (chunks.length === 0) return resolve(modSizes);

        chunks.forEach((chunk) => {
            const params = new URLSearchParams();
            params.append('itemcount', chunk.length);
            chunk.forEach((id, index) => params.append(`publishedfileids[${index}]`, id));
            params.append('format', 'json');
            const postData = params.toString();

            const req = https.request({
                hostname: 'api.steampowered.com',
                path: '/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) },
                timeout: 15000
            }, (res) => {
                let data = '';
                res.on('data', (c) => data += c);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.response && json.response.publishedfiledetails) {
                            json.response.publishedfiledetails.forEach(details => {
                                if (details.publishedfileid && details.file_size !== undefined) {
                                    const size = parseInt(details.file_size, 10);
                                    if (size > 0) {
                                        modSizes[details.publishedfileid] = size;
                                    }
                                }
                            });
                        }
                    } catch (e) {}
                    checkDone();
                });
            });
            const checkDone = () => { completedChunks++; if (completedChunks === chunks.length) resolve(modSizes); };
            req.on('error', checkDone);
            req.on('timeout', () => { req.destroy(); checkDone(); });
            req.write(postData);
            req.end();
        });
    });
}

function resolveCollectionViaAPI(collectionId) {
    return new Promise((resolve) => {
        const params = new URLSearchParams();
        params.append('collectioncount', 1);
        params.append('publishedfileids[0]', collectionId);
        params.append('format', 'json');
        const postData = params.toString();

        const req = https.request({
            hostname: 'api.steampowered.com',
            path: '/ISteamRemoteStorage/GetCollectionDetails/v1/',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) },
            timeout: 15000
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.response?.collectiondetails?.[0]?.children) {
                        resolve({ isCollection: true, ids: json.response.collectiondetails[0].children.map(c => c.publishedfileid).filter(id => id) });
                    } else resolve({ isCollection: false, ids: [collectionId] });
                } catch (e) { resolve({ isCollection: false, ids: [collectionId] }); }
            });
        });
        req.on('error', () => resolve({ isCollection: false, ids: [collectionId] }));
        req.on('timeout', () => { req.destroy(); resolve({ isCollection: false, ids: [collectionId] }); });
        req.write(postData); req.end();
    });
}

// ---------- DOM ----------
function resolveCollectionViaDOM(collectionId) {
    let tempWindow;
    let timeoutId;

    return new Promise((resolve) => {
        const execute = async () => {
            try {
                tempWindow = new BrowserWindow({
                    show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, offscreen: true, session: session.defaultSession }
                });

                await tempWindow.loadURL(`https://steamcommunity.com/sharedfiles/filedetails/?id=${collectionId}`);
                
                await tempWindow.webContents.executeJavaScript(`
                    new Promise((resolve) => {
                        const start = Date.now();
                        const interval = setInterval(() => {
                            if (document.querySelector('[id^="sharedfile_"]') || 
                                document.querySelector('[data-publishedfileid]') || 
                                document.querySelector('a[href*="filedetails/?id="]') ||
                                document.querySelector('.workshopItem')) {
                                clearInterval(interval);
                                resolve();
                            } else if (Date.now() - start > 8000) {
                                clearInterval(interval); 
                                resolve();
                            }
                        }, 500);
                    });
                `);

                const result = await tempWindow.webContents.executeJavaScript(`
                    (function() {
                        const sf = document.querySelectorAll('[id^="sharedfile_"]');
                        if (sf.length > 0) return { type: 'sf', ids: Array.from(sf).map(e => e.id.replace('sharedfile_', '')).filter(id => /^\\d+$/.test(id)) };
                        
                        const dt = document.querySelectorAll('[data-publishedfileid]');
                        if (dt.length > 0) return { type: 'dt', ids: Array.from(dt).map(e => e.getAttribute('data-publishedfileid')).filter(id => /^\\d+$/.test(id)) };
                        
                        const lk = document.querySelectorAll('a[href*="filedetails/?id="]');
                        if (lk.length > 0) { 
                            const ids = []; 
                            lk.forEach(l => { 
                                const m = l.href.match(/[?&]id=(\\d+)/); 
                                if (m && m[1]) ids.push(m[1]); 
                            }); 
                            return { type: 'lk', ids: [...new Set(ids)] }; 
                        }
                        return null;
                    })();
                `);

                if (result && result.ids && result.ids.length > 0) {
                    const filteredIds = result.ids.filter(id => id !== collectionId);
                    if (filteredIds.length > 0) {
                        resolve({ isCollection: true, ids: filteredIds, method: `DOM-${result.type}` });
                    } else {
                        resolve({ isCollection: false, ids: [collectionId], method: 'DOM-empty-after-filter' });
                    }
                } else {
                    resolve({ isCollection: false, ids: [collectionId], method: 'DOM-empty' });
                }
            } catch (e) {
                resolve({ isCollection: false, ids: [collectionId], method: 'DOM-error' });
            } finally {
                clearTimeout(timeoutId);
                if (tempWindow && !tempWindow.isDestroyed()) tempWindow.close();
            }
        };

        timeoutId = setTimeout(() => {
            if (tempWindow && !tempWindow.isDestroyed()) tempWindow.close();
            resolve({ isCollection: false, ids: [collectionId], method: 'DOM-timeout' });
        }, 20000);

        execute();
    });
}

// ---------- Regex ----------
function resolveCollectionViaRegex(collectionId) {
    let tempWindow;
    let timeoutId;

    return new Promise((resolve) => {
        const execute = async () => {
            try {
                tempWindow = new BrowserWindow({
                    show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, offscreen: true, session: session.defaultSession }
                });

                await tempWindow.loadURL(`https://steamcommunity.com/sharedfiles/filedetails/?id=${collectionId}`);
                await new Promise(r => setTimeout(r, 3000)); 

                const html = await tempWindow.webContents.executeJavaScript('document.documentElement.innerHTML');
                const foundIds = new Set();
                let match;

                const rx1 = /id=["']sharedfile_(\d+)["']/g; 
                while ((match = rx1.exec(html)) !== null) if (match[1] !== collectionId) foundIds.add(match[1]);

                const rx2 = /(?:sharedfiles|workshop)\/filedetails\/\?id=(\d+)/g; 
                while ((match = rx2.exec(html)) !== null) if (match[1] !== collectionId) foundIds.add(match[1]);

                const rx3 = /data-publishedfileid=["'](\d+)["']/g; 
                while ((match = rx3.exec(html)) !== null) if (match[1] !== collectionId) foundIds.add(match[1]);

                const cleanIds = [...foundIds];

                if (cleanIds.length > 0) {
                    resolve({ isCollection: true, ids: cleanIds, method: 'Regex' });
                } else {
                    resolve({ isCollection: false, ids: [collectionId], method: 'Regex-empty' });
                }
            } catch (e) {
                resolve({ isCollection: false, ids: [collectionId], method: 'Regex-error' });
            } finally {
                clearTimeout(timeoutId);
                if (tempWindow && !tempWindow.isDestroyed()) tempWindow.close();
            }
        };

        timeoutId = setTimeout(() => {
            if (tempWindow && !tempWindow.isDestroyed()) tempWindow.close();
            resolve({ isCollection: false, ids: [collectionId], method: 'Regex-timeout' });
        }, 20000);

        execute();
    });
}

// ---------- Пайплайн ----------
async function resolveCollection(collectionId, event, lang, depth = 0) {
    if (depth > 3) return [];
    event.reply('log', t(lang, 'analyzing', { id: collectionId }));

    let result = await resolveCollectionViaAPI(collectionId);
    if (result.isCollection && result.ids.length > 0) {
        event.reply('log', t(lang, 'collFoundApi', { count: result.ids.length }));
        return result.ids;
    } else event.reply('log', t(lang, 'failApi'));

    result = await resolveCollectionViaDOM(collectionId);
    if (result.isCollection && result.ids.length > 0) {
        event.reply('log', t(lang, 'collFoundDom', { count: result.ids.length }));
        return result.ids;
    } else event.reply('log', t(lang, 'failDom'));

    result = await resolveCollectionViaRegex(collectionId);
    if (result.isCollection && result.ids.length > 0) {
        event.reply('log', t(lang, 'collFoundRegex', { count: result.ids.length }));
        return result.ids;
    } else event.reply('log', t(lang, 'failRegex'));

    return [collectionId];
}

function downloadMod(steamCmdPath, appId, modId, expectedSize, event, lang, index, totalCount) {
    return new Promise((resolve) => {
        const steamCmdDir = path.dirname(steamCmdPath);
        const modPath = path.join(steamCmdDir, 'steamapps', 'workshop', 'content', appId, modId);
        
        let isDone = false;
        let lastBytes = 0;
        let lastTime = Date.now();
        let currentSpeed = 0;
        let isCalculating = false;

        const progressTimer = setInterval(async () => {
            if (isDone || isCalculating) return;
            isCalculating = true;
            const currentBytes = await getDirSize(modPath);
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000;
            if (timeDiff > 0) {
                const byteDiff = currentBytes - lastBytes;
                if (byteDiff > 0) currentSpeed = (currentSpeed * 0.4) + ((byteDiff / timeDiff) * 0.6);
                else if (byteDiff === 0 && currentBytes >= expectedSize) currentSpeed = 0;
            }
            const totalBytes = expectedSize > 0 ? expectedSize : Math.max(currentBytes, 1);
            event.reply('mod-progress', { modId, index, totalCount, downloaded: currentBytes, total: totalBytes, speed: currentSpeed });
            lastBytes = currentBytes;
            lastTime = now;
            isCalculating = false;
        }, 3000);

        const sizeStr = expectedSize ? `${(expectedSize/1024/1024).toFixed(1)} MB` : t(lang, 'unknownSize');
        event.reply('log', t(lang, 'downloading', { id: modId, size: sizeStr }));

        const command = `"${steamCmdPath}" +login anonymous +workshop_download_item ${appId} ${modId} +quit`;
        const child = exec(command);

        child.on('close', async () => {
            isDone = true;
            clearInterval(progressTimer);
            const finalSize = await getDirSize(modPath);
            event.reply('mod-progress', { modId, index, totalCount, downloaded: finalSize, total: finalSize, speed: 0 });
            event.reply('log', t(lang, 'downloaded', { id: modId }));
            resolve(finalSize);
        });

        child.on('error', async () => { 
            isDone = true; 
            clearInterval(progressTimer); 
            const finalSize = await getDirSize(modPath);
            event.reply('mod-progress', { modId, index, totalCount, downloaded: finalSize, total: expectedSize || finalSize, speed: 0 });
            resolve(finalSize); 
        });
    });
}

ipcMain.on('start-download', async (event, { rawInput, appId, lang }) => {
    event.reply('log', t(lang, 'initAnalyze'));
    const potentialIds = extractPotentialIds(rawInput);
    
    if (potentialIds.length === 0) return event.reply('log', t(lang, 'noIds'));

    event.reply('log', t(lang, 'foundPotential', { count: potentialIds.length }));
    let allModIds = [];

    for (const id of potentialIds) {
        const resolved = await resolveCollection(id, event, lang);
        allModIds.push(...resolved);
    }

    let finalQueue = [...new Set(allModIds)];
    if (finalQueue.length === 0) return event.reply('log', t(lang, 'queueEmpty'));

    event.reply('log', t(lang, 'finalQueue', { count: finalQueue.length }));
    event.reply('log', t(lang, 'reqSizes'));
    
    const modSizes = await getModSizes(finalQueue);
    const validQueue = finalQueue.filter(id => modSizes[id] !== undefined);
    
    const skippedCount = finalQueue.length - validQueue.length;
    if (skippedCount > 0) {
        event.reply('log', t(lang, 'skippedItems', { count: skippedCount }));
    }
    
    if (validQueue.length === 0) {
        event.reply('log', '⚠️ Все объекты в очереди оказались невалидными.');
        return;
    }

    const totalAppSize = Object.values(modSizes).reduce((a, b) => a + b, 0);
    event.reply('log', t(lang, 'totalSize', { size: (totalAppSize / 1024 / 1024 / 1024).toFixed(2) }));

    let downloadedAppSize = 0;
    let lastGlobalTime = Date.now();
    let globalSpeed = 0;

    // ✅ НОВЫЙ БЛОК: Динамическое определение пути (работает и в dev, и в собранном .exe)
    const isPackaged = app.isPackaged;
    const resourcesPath = isPackaged ? process.resourcesPath : __dirname;
    const steamCmdPath = path.join(resourcesPath, 'steamcmd', 'steamcmd.exe');
    // ---------------------------------------------------------------------------------

    if (!fs.existsSync(steamCmdPath)) return event.reply('log', t(lang, 'noSteamCmd', { path: steamCmdPath }));

    for (let i = 0; i < validQueue.length; i++) {
        const modId = validQueue[i];
        const expectedSize = modSizes[modId] || 0;
        
        event.reply('global-progress', { downloaded: downloadedAppSize, total: totalAppSize, speed: globalSpeed });

        const actualSize = await downloadMod(steamCmdPath, appId, modId, expectedSize, event, lang, i + 1, validQueue.length);
        downloadedAppSize += actualSize; 
        
        const newNow = Date.now();
        const newTimeDiff = (newNow - lastGlobalTime) / 1000;
        if (newTimeDiff > 0 && actualSize > 0) globalSpeed = (globalSpeed * 0.5) + ((actualSize / newTimeDiff) * 0.5);
        lastGlobalTime = newNow;

        event.reply('global-progress', { downloaded: downloadedAppSize, total: totalAppSize, speed: globalSpeed });
    }

    const resultPath = path.join(path.dirname(steamCmdPath), 'steamapps', 'workshop', 'content', appId);
    event.reply('log', t(lang, 'allDone'));
    event.reply('log', t(lang, 'resultPath', { path: resultPath }));
    event.reply('global-progress', { downloaded: totalAppSize, total: totalAppSize, speed: 0 });
});