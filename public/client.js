// ========== SecureChat Client ==========
// End-to-end encrypted chat with AES-256-GCM

// ----------- URL Parameters -----------
const urlParams = new URLSearchParams(window.location.search);
const ROOM = urlParams.get('r');
const USERNAME = urlParams.get('u');
const PASSWORD = urlParams.get('p');

// Redirect if missing parameters
if (!ROOM || !PASSWORD) {
    window.location.href = '/';
}

// ----------- Global State -----------
const socket = io();
let AESKey = null;
let salt = null;
let isTyping = false;
let typingTimeout = null;
let messageQueue = [];

// ----------- DOM Elements -----------
const roomNameEl = document.getElementById('roomName');
const userCountEl = document.getElementById('userCount');
const messagesEl = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const fileInput = document.getElementById('file');
const sendBtn = document.getElementById('send');
const attachBtn = document.getElementById('attach');
const leaveBtn = document.getElementById('leave');
const themeToggle = document.getElementById('themeToggle');
const typingIndicator = document.getElementById('typingIndicator');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');

// ----------- Crypto Utilities -----------
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const subtle = crypto.subtle;

async function deriveKey(password, saltBytes) {
    try {
        const baseKey = await subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return await subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (error) {
        console.error('Key derivation failed:', error);
        throw error;
    }
}

async function encryptMessage(data) {
    try {
        if (!AESKey) throw new Error('No encryption key available');

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;

        const encrypted = await subtle.encrypt(
            { name: 'AES-GCM', iv },
            AESKey,
            dataBuffer
        );

        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
}

async function decryptMessage(encryptedData) {
    try {
        if (!AESKey) throw new Error('No decryption key available');

        const { iv, data } = encryptedData;
        const decrypted = await subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            AESKey,
            new Uint8Array(data)
        );

        return new Uint8Array(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
    }
}

// ----------- UI Utilities -----------
function addMessage(content, sender = null, isSystem = false, isFile = false, fileName = null, mimeType = null) {
    const messageEl = document.createElement('div');
    messageEl.className = isSystem ? 'system-message' : 'message';
    messageEl.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!isSystem && sender === USERNAME) {
        messageEl.classList.add('own');
    }

    if (isSystem) {
        messageEl.textContent = content;
    } else {
        const headerEl = document.createElement('div');
        headerEl.className = 'message-header';
        headerEl.textContent = sender;

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';

        if (isFile && fileName) {
            if (mimeType && mimeType.startsWith('image/')) {
                const imgEl = document.createElement('img');
                imgEl.src = content;
                imgEl.alt = fileName;
                imgEl.title = fileName;
                imgEl.style.maxWidth = '200px';
                imgEl.style.maxHeight = '200px';
                imgEl.style.cursor = 'pointer';
                imgEl.onclick = () => showImageModal(content);
                contentEl.appendChild(imgEl);
            } else {
                const linkEl = document.createElement('a');
                linkEl.href = content;
                linkEl.textContent = `📎 ${fileName}`;
                linkEl.download = fileName;
                linkEl.className = 'file-message';
                linkEl.target = '_blank';
                contentEl.appendChild(linkEl);
            }
        } else {
            contentEl.textContent = content;
        }

        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageEl.appendChild(headerEl);
        messageEl.appendChild(contentEl);
        messageEl.appendChild(timeEl);
    }

    messagesEl.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showImageModal(src) {
    modalImage.src = src;
    imageModal.style.display = 'flex';
}

function hideImageModal() {
    imageModal.style.display = 'none';
    modalImage.src = '';
}

function setTypingIndicator(text) {
    typingIndicator.textContent = text;
}

function updateUserCount(count) {
    userCountEl.textContent = `${count} user${count !== 1 ? 's' : ''}`;
}

// ----------- Theme Management -----------
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    localStorage.setItem('theme', newTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// ----------- File Handling -----------
async function handleFileUpload(file) {
    try {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const encrypted = await encryptMessage(new Uint8Array(arrayBuffer));

        const messageData = {
            room: ROOM,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: USERNAME,
            fileName: file.name,
            mimeType: file.type,
            salt: salt ? Array.from(salt) : null,
            ...encrypted,
            timestamp: Date.now()
        };

        socket.emit('message', messageData);

        // Show file in own messages immediately
        const objectUrl = URL.createObjectURL(file);
        addMessage(objectUrl, USERNAME, false, true, file.name, file.type);

    } catch (error) {
        console.error('File upload error:', error);
        alert('Failed to upload file. Please try again.');
    }
}

// ----------- Socket Event Handlers -----------
socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join', { room: ROOM, username: USERNAME });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    addMessage('Disconnected from server. Attempting to reconnect...', null, true);
});

socket.on('system', (message) => {
    addMessage(message, null, true);
});

socket.on('userCount', (count) => {
    updateUserCount(count);
});

socket.on('message', async (messageData) => {
    try {
        // Initialize key if this is the first message with salt
        if (!AESKey && messageData.salt) {
            salt = new Uint8Array(messageData.salt);
            AESKey = await deriveKey(PASSWORD, salt);
        }

        if (!AESKey) {
            console.error('No encryption key available');
            return;
        }

        const decryptedData = await decryptMessage(messageData);

        if (messageData.fileName) {
            // Handle file message
            const blob = new Blob([decryptedData], { type: messageData.mimeType });
            const objectUrl = URL.createObjectURL(blob);

            addMessage(objectUrl, messageData.from, false, true, messageData.fileName, messageData.mimeType);
        } else {
            // Handle text message
            const text = decoder.decode(decryptedData);
            addMessage(text, messageData.from);
        }
    } catch (error) {
        console.error('Message processing error:', error);
        addMessage('Failed to decrypt message', messageData.from);
    }
});

socket.on('delete', (data) => {
    const messageEl = document.getElementById(data.id);
    if (messageEl) {
        messageEl.remove();
    }
});

socket.on('typing', (data) => {
    if (data.from !== USERNAME) {
        setTypingIndicator(`${data.from} is typing...`);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setTypingIndicator('');
        }, 2000);
    }
});

// ----------- Event Listeners -----------
sendBtn.addEventListener('click', async () => {
    const message = msgInput.value.trim();
    if (!message) return;

    try {
        // Initialize salt and key for first message
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(16));
            AESKey = await deriveKey(PASSWORD, salt);
        }

        const encrypted = await encryptMessage(message);
        const messageData = {
            room: ROOM,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: USERNAME,
            salt: Array.from(salt),
            ...encrypted,
            timestamp: Date.now()
        };

        socket.emit('message', messageData);
        addMessage(message, USERNAME);
        msgInput.value = '';

    } catch (error) {
        console.error('Send message error:', error);
        alert('Failed to send message. Please try again.');
    }
});

msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }

    // Typing indicator
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { room: ROOM, from: USERNAME });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
    }, 1000);
});

attachBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => handleFileUpload(file));
    e.target.value = ''; // Clear input
});

leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave this chat?')) {
        window.location.href = '/';
    }
});

themeToggle.addEventListener('click', toggleTheme);

// Modal event listeners
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        hideImageModal();
    }
});

document.querySelector('.close').addEventListener('click', hideImageModal);

// Context menu for message deletion
messagesEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const messageEl = e.target.closest('.message');
    if (messageEl && messageEl.classList.contains('own') && messageEl.id) {
        if (confirm('Delete this message for everyone?')) {
            socket.emit('delete', { room: ROOM, id: messageEl.id });
        }
    }
});

// Drag and drop file upload
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = 'var(--border-light)';
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = '';
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = '';

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileUpload(file));
});

// ----------- Initialization -----------
document.addEventListener('DOMContentLoaded', () => {
    roomNameEl.textContent = `Room: ${ROOM}`;
    msgInput.focus();
    initTheme();

    // Add welcome message
    addMessage(`Welcome to the secure chat room "${ROOM}"! Your messages are end-to-end encrypted.`, null, true);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'd':
                e.preventDefault();
                toggleTheme();
                break;
            case 'l':
                e.preventDefault();
                leaveBtn.click();
                break;
        }
    }
});

// Service Worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registered'))
            .catch(() => console.log('SW registration failed'));
    });
}

console.log('🔐 SecureChat initialized with AES-256-GCM encryption');