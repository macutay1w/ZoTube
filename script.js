// public/script.js
const socket = io();
let currentUser = null;
let currentRoom = null;

// Ekran Değiştirme Yardımcısı
function showScreen(id) {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- Auth İşlemleri ---
async function register() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    alert(data.message);
}

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (data.success) {
        currentUser = data.username;
        document.getElementById('display-user').innerText = currentUser;
        showScreen('room-screen');
    } else {
        document.getElementById('auth-error').innerText = data.message;
    }
}

// --- Oda İşlemleri ---
async function createRoom() {
    const name = document.getElementById('new-room-name').value;
    const pass = document.getElementById('new-room-pass').value;
    const res = await fetch('/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password: pass, creator: currentUser })
    });
    const data = await res.json();
    alert(data.message);
}

async function joinRoom() {
    const name = document.getElementById('join-room-name').value;
    const pass = document.getElementById('join-room-pass').value;
    
    const res = await fetch('/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password: pass })
    });
    const data = await res.json();
    
    if (data.success) {
        currentRoom = name;
        document.getElementById('room-title').innerText = "Oda: " + currentRoom;
        document.getElementById('messages').innerHTML = ''; // Temizle
        showScreen('chat-screen');
        
        // Socket Odasına Katıl
        socket.emit('joinRoom', { username: currentUser, room: currentRoom });
    } else {
        alert(data.message);
    }
}

function leaveRoom() {
    currentRoom = null;
    showScreen('room-screen');
    // Sayfayı yenilemek en temiz çıkış yoludur basit uygulamalarda
    window.location.reload(); 
}

// --- Mesajlaşma & Dosya ---
function sendMessage(text = null, type = 'text', fileUrl = null) {
    const input = document.getElementById('msg-input');
    const msgText = text || input.value;
    
    if (!msgText && !fileUrl) return;

    socket.emit('chatMessage', {
        room: currentRoom,
        user: currentUser,
        text: msgText,
        type: type,
        fileUrl: fileUrl
    });
    input.value = '';
}

// Dosya Yükleme
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
        let type = 'file';
        if (data.type.startsWith('image/')) type = 'image';
        if (data.type.startsWith('video/')) type = 'video';
        
        sendMessage(data.fileName, type, data.fileUrl);
    }
}

// Mesajı Ekrana Basma
socket.on('message', (msg) => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.user === currentUser ? 'my-message' : 'other-message');
    
    let content = `<div class="meta">${msg.user}</div>`;
    
    if (msg.type === 'text') {
        content += `<div>${msg.text}</div>`;
    } else if (msg.type === 'image') {
        content += `<img src="${msg.fileUrl}" width="200">`;
    } else if (msg.type === 'video') {
        content += `<video src="${msg.fileUrl}" controls width="200"></video>`;
    } else {
        content += `<a href="${msg.fileUrl}" target="_blank">📄 ${msg.text} (İndir)</a>`;
    }
    
    div.innerHTML = content;
    const container = document.getElementById('messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
});