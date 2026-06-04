// --- Initialisation globale (Safe) ---
const gun = Gun(['https://gundb-relay.onrender.com/gun']);
const postsNode = gun.get('mesh-posts-verif-v5');
const systemControlNode = gun.get('mesh-system-control-v5');

let isAdminActive = false;
let currentResetTimestamp = 0;
const mySeed = 'u_' + Math.random().toString(36).substr(2, 4);
let base64ImageCache = "";
let codeSnippetCache = "";
let codeLanguageCache = "javascript";

const templates = {
    javascript: `// Script JS\nlet message = "Hello World !";\nconsole.log(message);`,
    python: `# Script Python\nfor i in range(3):\n  print(f"Ligne : {i}")`,
    html: `\n<div style="padding:15px; text-align:center; color:#4f46e5;">\n  <h3>Rendu OK</h3>\n</div>`
};

// --- Fonctions Admin ---
window.verifyAdminStatus = function() {
    const privateKeyRaw = localStorage.getItem('mesh_secret_admin_key');
    if (!privateKeyRaw) { alert("❌ Accès refusé."); return; }
    
    isAdminActive = true;
    document.body.classList.add('admin-mode');
    
    const adminBtn = document.getElementById('adminBtn');
    const adminBtnText = document.getElementById('adminBtnText');
    if (adminBtn) adminBtn.classList.add('is-admin');
    if (adminBtnText) adminBtnText.innerText = "Mode Admin Confirmé";
};

window.resetNetworkFeed = function() {
    if(!isAdminActive) return;
    if(confirm("⚠️ Tout effacer ?")) {
        systemControlNode.put({ action: "global_reset", timestamp: Date.now() });
    }
};

// --- Réseau ---
systemControlNode.on((data) => {
    if(data && data.action === "global_reset" && data.timestamp > currentResetTimestamp) {
        currentResetTimestamp = data.timestamp;
        const feed = document.getElementById('globalFeed');
        if(feed) feed.innerHTML = '';
    }
});

// --- IDE & UI (Manipulés uniquement à la demande) ---
window.openIDE = function(preloadedCode = "", lang = "javascript") {
    const idePanel = document.getElementById('idePanel');
    const ideSource = document.getElementById('ideSource');
    const ideLang = document.getElementById('ideLang');
    
    if (idePanel) idePanel.classList.add('open');
    if (ideLang) ideLang.value = lang;
    if (ideSource) ideSource.value = preloadedCode || templates[lang];
    window.toggleOutputs();
};

window.closeIDE = function() {
    const idePanel = document.getElementById('idePanel');
    if (idePanel) idePanel.classList.remove('open');
};

window.toggleOutputs = function() {
    const lang = document.getElementById('ideLang')?.value;
    const consoleOut = document.getElementById('consoleOutput');
    const htmlPreview = document.getElementById('htmlPreview');
    const consoleTitle = document.getElementById('consoleTitle');
    
    if(!consoleOut || !htmlPreview) return;

    if(lang === "html") {
        consoleOut.style.display = "none"; 
        htmlPreview.style.display = "block";
        if(consoleTitle) consoleTitle.innerText = "LIVE VIEW";
    } else {
        consoleOut.style.display = "block"; 
        htmlPreview.style.display = "none";
        if(consoleTitle) consoleTitle.innerText = "CONSOLE";
    }
};

window.publishNewPost = function() {
    const inputEl = document.getElementById('postText');
    const userEl = document.getElementById('usernameInput');
    const statusEl = document.getElementById('statusBox');
    
    const text = inputEl?.value.trim();
    const author = userEl?.value.trim() || "Anonyme";
    
    if (!text && !base64ImageCache && !codeSnippetCache) return;
    
    const postId = 'p_' + Date.now();
    postsNode.get(postId).put({
        id: postId, author: author, text: text,
        image: base64ImageCache, code: codeSnippetCache, lang: codeLanguageCache,
        timestamp: Date.now(), uid: mySeed
    });
    
    if(inputEl) inputEl.value = "";
    if(statusEl) statusEl.innerText = "";
};

// Auto-init léger
if(localStorage.getItem('mesh_secret_admin_key')) window.verifyAdminStatus();
if(typeof lucide !== 'undefined') lucide.createIcons();
