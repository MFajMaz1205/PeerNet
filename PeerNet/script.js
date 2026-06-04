document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de Gun
    const gun = Gun(['https://gundb-relay.onrender.com/gun']);
    const postsNode = gun.get('mesh-posts-verif-v5');
    const blacklistNode = gun.get('mesh-blacklist-verif-v5');
    const systemControlNode = gun.get('mesh-system-control-v5');

    const MAIN_ADMIN_PUBLIC_KEY = "caca";
    let isAdminActive = false;
    let blacklistedIds = {};
    let currentResetTimestamp = 0;
    const mySeed = 'u_' + Math.random().toString(36).substr(2, 4);
    let activeThreadId = null;
    let base64ImageCache = "";
    let codeSnippetCache = "";
    let codeLanguageCache = "javascript";
    let pyodideInstance = null;
    let localPostsCache = {};

    try { localPostsCache = JSON.parse(localStorage.getItem('mesh_posts_backup')) || {}; } catch(e) {}

    const templates = {
        javascript: `// Script JS\nlet message = "Hello World !";\nconsole.log(message);`,
        python: `# Script Python\nfor i in range(3):\n    print(f"Ligne : {i}")`,
        html: `\n<div style="padding:15px; text-align:center; color:#4f46e5;">\n  <h3>Rendu OK</h3>\n</div>`
    };

    // Initialisation des éléments de base
    const ideSource = document.getElementById('ideSource');
    if (ideSource) ideSource.value = templates.javascript;

    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        if(localStorage.getItem('p2p-username-modern')) usernameInput.value = localStorage.getItem('p2p-username-modern');
        usernameInput.addEventListener('input', (e) => localStorage.setItem('p2p-username-modern', e.target.value.trim()));
    }

    // --- Fonctions Admin ---
    window.verifyAdminStatus = async function() {
        const privateKeyRaw = localStorage.getItem('mesh_secret_admin_key');
        if (!privateKeyRaw) {
            alert("❌ Accès refusé.");
            return;
        }
        isAdminActive = true;
        document.body.classList.add('admin-mode');
        const adminBtn = document.getElementById('adminBtn');
        const adminBtnText = document.getElementById('adminBtnText');
        if (adminBtn) adminBtn.classList.add('is-admin');
        if (adminBtnText) adminBtnText.innerText = "Mode Admin Confirmé";
    };

    window.resetNetworkFeed = async function() {
        if(!isAdminActive) return;
        if(confirm("⚠️ Tout effacer pour tout le monde ?")) {
            systemControlNode.put({ action: "global_reset", timestamp: Date.now() });
        }
    };

    // --- Écouteurs Réseau ---
    systemControlNode.on((data) => {
        if(data && data.action === "global_reset" && data.timestamp > currentResetTimestamp) {
            currentResetTimestamp = data.timestamp;
            document.getElementById('globalFeed').innerHTML = '';
            closeThread();
            localPostsCache = {};
            localStorage.setItem('mesh_posts_backup', JSON.stringify(localPostsCache));
        }
    });

    // --- Fonctions IDE et Posts ---
    window.openIDE = function(preloadedCode = "", lang = "javascript") {
        document.getElementById('idePanel').classList.add('open');
        document.getElementById('ideLang').value = lang;
        if (preloadedCode) document.getElementById('ideSource').value = preloadedCode;
        else adaptTemplateLanguage();
        toggleOutputs();
    };

    window.closeIDE = function() { document.getElementById('idePanel').classList.remove('open'); };

    window.adaptTemplateLanguage = function() {
        const lang = document.getElementById('ideLang').value;
        document.getElementById('ideSource').value = templates[lang];
        toggleOutputs();
    };

    window.toggleOutputs = function() {
        const lang = document.getElementById('ideLang').value;
        const consoleOut = document.getElementById('consoleOutput');
        const htmlPreview = document.getElementById('htmlPreview');
        if(lang === "html") {
            consoleOut.style.display = "none"; htmlPreview.style.display = "block";
            document.getElementById('consoleTitle').innerText = "LIVE VIEW";
        } else {
            consoleOut.style.display = "block"; htmlPreview.style.display = "none";
            document.getElementById('consoleTitle').innerText = "CONSOLE";
        }
    };

    window.publishNewPost = function() {
        const inputEl = document.getElementById('postText');
        const text = inputEl.value.trim();
        const author = document.getElementById('usernameInput').value.trim() || "Anonyme";
        if (!text && !base64ImageCache && !codeSnippetCache) return;
        
        const postId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        postsNode.get(postId).put({
            id: postId, author: author, text: text,
            image: base64ImageCache, code: codeSnippetCache, lang: codeLanguageCache,
            timestamp: Date.now(), uid: mySeed
        });
        inputEl.value = ""; base64ImageCache = ""; codeSnippetCache = "";
        document.getElementById('statusBox').innerText = "";
    };

    // --- Utilitaires ---
    window.escapeHTML = function(str) { 
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t)); 
    };

    if(localStorage.getItem('mesh_secret_admin_key')) verifyAdminStatus();
    lucide.createIcons();
});