// video.js — Hand2Heart Video Chat (WebRTC + Socket.IO signaling)
// This is the single source of truth for the video-chat.html WebRTC implementation.
// (Consolidated here from an inline <script> block that used to live directly in
// video-chat.html; a separate older PeerJS-based implementation that previously
// lived in this file has been superseded, as it referenced DOM elements
// (#myVideo/#userVideo) that no longer exist in the current video-chat.html markup.)

// DOM Elements
const startBtn = document.getElementById('startBtn');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const hangupBtn = document.getElementById('hangupBtn');
const statusDiv = document.getElementById('signaling-status');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomLinkContainer = document.getElementById('room-link-container');
const roomLinkInput = document.getElementById('roomLink');

// WebRTC State
let localStream;
let peerConnection;
let currentRoom; 
let isCaller = false;

const socket = io(); 

const configuration = {
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
]
};

// --- Utility Functions ---
function getLoggedInUser() {
const user = JSON.parse(localStorage.getItem('user'));
if (user && user.role) {
    return user;
}
return null;
}

function updateStatus(message) {
console.log(message);
const existingParagraph = statusDiv.querySelector('p');
statusDiv.innerHTML = `<strong>Status:</strong> ${message}`;
if (existingParagraph) {
    statusDiv.appendChild(existingParagraph);
}
}

function endCallCleanup() {
if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
}
if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
}
localVideo.srcObject = null;
remoteVideo.srcObject = null;

startBtn.disabled = false;
joinBtn.disabled = true;
createBtn.disabled = true;
hangupBtn.disabled = true;

window.history.pushState({}, document.title, window.location.pathname);
roomLinkContainer.style.display = 'none';

updateStatus("Call ended. Ready to start a new one.");
window.location.reload(); 
}

// --- Socket.IO Event Handlers (Unchanged from last successful signaling logic) ---
socket.on('connect', () => {
console.log('Connected to signaling server:', socket.id);
initializeUI(); 
});

socket.on('peer-joined', async ({ peerId }) => {
updateStatus(`A peer (${peerId}) joined room **${currentRoom}**!`);

if (isCaller && peerConnection) {
    updateStatus(`Peer (${peerId}) joined. Creating offer...`);
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc-offer', { offer, roomId: currentRoom });
        updateStatus('Offer sent to peer. Waiting for answer...');
    } catch (e) {
        console.error('Error creating or sending offer:', e);
        updateStatus('Error creating or sending offer. Ending call.');
        endCallCleanup();
    }
}
});

socket.on('webrtc-offer', async ({ offer, fromId }) => {
if (!isCaller && !peerConnection) {
    startCall();
}

if (!isCaller && peerConnection) {
    updateStatus(`Received offer from ${fromId}. Setting remote description...`);
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('webrtc-answer', { answer, roomId: currentRoom });
        updateStatus('Sent answer to seller. Waiting for ICE candidates...');
    } catch (e) {
        console.error('Error handling offer:', e);
        updateStatus('Error processing offer. Ending call.');
        endCallCleanup();
    }
}
});

socket.on('webrtc-answer', async ({ answer, fromId }) => {
if (isCaller && peerConnection) {
    updateStatus(`Received answer from ${fromId}. Setting remote description...`);
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
        console.error('Error handling answer:', e);
        updateStatus('Error processing answer. Ending call.');
        endCallCleanup();
    }
}
});

socket.on('webrtc-ice-candidate', async ({ candidate, fromId }) => {
try {
    if (candidate && peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`Added ICE candidate from ${fromId}.`);
    }
} catch (e) {
    console.error('Error adding received ICE candidate:', e);
}
});

// --- Core UI Logic ---
function initializeUI() {
const user = getLoggedInUser();
const urlParams = new URLSearchParams(window.location.search);
const roomIdFromUrl = urlParams.get('room');

startBtn.disabled = false;
createBtn.disabled = true;
joinBtn.disabled = true;
hangupBtn.disabled = true;
roomLinkContainer.style.display = 'none';

if (!user) {
    updateStatus('You must be logged in to use video chat. Please <a href="register.html">register or log in</a> to continue.');
    startBtn.disabled = true;
    createBtn.style.display = 'none';
    joinBtn.style.display = 'none';
    return;
}

if (!socket.connected) {
     updateStatus('Connecting to signaling server...');
     startBtn.disabled = true;
     return;
}

if (user.role === 'seller') {
    joinBtn.style.display = 'none'; 
    isCaller = true;

    if (roomIdFromUrl) {
        currentRoom = roomIdFromUrl;
        
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + currentRoom;
        roomLinkInput.value = newUrl;
        roomLinkContainer.style.display = 'block';
        roomLinkInput.readOnly = true;
        roomLinkContainer.querySelector('strong').textContent = "Share this Room Link with your customer (proper link):";
        roomLinkContainer.querySelector('button').textContent = "Copy";
        roomLinkContainer.querySelector('button').onclick = copyRoomLink;
        roomLinkContainer.querySelector('button').style.display = 'inline-block';
        
        updateStatus(`Room **${currentRoom}** ready. Start your camera and connect.`);
        createBtn.disabled = true;
        
    } else {
        createBtn.disabled = false;
        createBtn.style.display = 'block';
        updateStatus(`Welcome, **Seller**! Start your camera and click **'Create Room'**.`);
    }

} else if (user.role === 'user') {
    createBtn.style.display = 'none'; 
    isCaller = false;

    if (roomIdFromUrl) {
        currentRoom = roomIdFromUrl;
        updateStatus(`Welcome, **Customer**! Room link found. Start your camera to join room '${currentRoom}'.`);
        
        // Setup the view for the joining user
        roomLinkInput.value = window.location.href; 
        roomLinkInput.readOnly = true;
        roomLinkContainer.style.display = 'block';
        roomLinkContainer.querySelector('strong').textContent = "Joining Room:";
        roomLinkContainer.querySelector('button').style.display = 'none';
        
        joinBtn.disabled = true;
        startBtn.disabled = false;
    } else {
        // This is the customer's paste-to-join interface
        roomLinkContainer.querySelector('strong').textContent = "Paste the Room Link from the seller below:";
        roomLinkInput.value = '';
        roomLinkInput.readOnly = false;
        roomLinkInput.placeholder = "Paste link here (e.g., https://yourdomain.com/video-chat.html?room=xxxx)";
        roomLinkContainer.querySelector('button').textContent = "Go to Room";
        roomLinkContainer.querySelector('button').onclick = goToRoomFromPaste;
        roomLinkContainer.querySelector('button').style.display = 'inline-block';
        roomLinkContainer.style.display = 'block';

        updateStatus(`Welcome, **Customer**! Paste your seller's link to start.`);
        joinBtn.style.display = 'none'; 
        startBtn.disabled = true; 
    }
} else {
    updateStatus('Your account role does not permit video chat access.');
    startBtn.disabled = true;
    createBtn.style.display = 'none';
    joinBtn.style.display = 'none';
    roomLinkContainer.style.display = 'none';
}
}

function goToRoomFromPaste() {
const pastedUrl = roomLinkInput.value.trim();
try {
    const urlObj = new URL(pastedUrl);
    const urlParams = new URLSearchParams(urlObj.search);
    const roomId = urlParams.get('room');

    if (roomId) {
        window.location.href = window.location.pathname + `?room=${roomId}`;
    } else {
        alert("Invalid room link. Please ensure it contains a '?room=xxxx' parameter.");
    }
} catch (e) {
     alert("Invalid URL format pasted.");
}
}

// -----------------------------------------------------
// --- 1. Start Camera ---
// -----------------------------------------------------
startBtn.onclick = async () => {
const user = getLoggedInUser();
if (!user) return;

try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    startBtn.disabled = true;
    hangupBtn.disabled = false;
    
    localVideo.srcObject = null; 
    remoteVideo.srcObject = null; 

    if (user.role === 'seller') {
        // SELLER: Local video goes to the RIGHT/PEER panel
        remoteVideo.srcObject = localStream;
        updateStatus(`Camera started. **Your video is now in the Seller/Peer view.** Click 'Create Room' or 'Join Room'.`);

        if (currentRoom) {
            startCall();
            socket.emit('join-room', currentRoom);
            createBtn.disabled = true;
        } else {
            createBtn.disabled = false;
        }
        
    } else if (user.role === 'user' && currentRoom) {
        // CUSTOMER: Local video goes to the LEFT/YOUR panel
        localVideo.srcObject = localStream;
        updateStatus(`Camera started. **Your video is now in the Your Video view.** Click 'Join Room'.`);

        joinBtn.disabled = false;
    } else if (user.role === 'user' && !currentRoom) {
        localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        updateStatus("Error: Cannot start call. Paste a room link first.");
        startBtn.disabled = true;
        hangupBtn.disabled = true;
    }

} catch (error) {
    console.error('Error accessing media devices.', error);
    alert('Could not access your camera or microphone. Please check permissions.');
    startBtn.disabled = false;
    hangupBtn.disabled = true;
}
};

// -----------------------------------------------------
// --- 2a. Create a Room (Seller-Only) ---
// -----------------------------------------------------
createBtn.onclick = () => {
const user = getLoggedInUser();
if (user?.role !== 'seller' || !localStream) {
    updateStatus("Error: Only sellers with an active camera can create rooms.");
    return;
}

isCaller = true;
createBtn.disabled = true;

const newRoomId = 'room-' + Math.random().toString(36).substr(2, 9);
currentRoom = newRoomId;

const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + newRoomId;
window.history.pushState({path: newUrl}, '', newUrl); 

roomLinkInput.value = newUrl;
roomLinkContainer.style.display = 'block';

updateStatus(`Room **${currentRoom}** created! Share the proper link and wait for the customer to join...`);

startCall(); 
socket.emit('join-room', currentRoom);
};

function copyRoomLink() {
roomLinkInput.select();
document.execCommand('copy');
alert('Room link copied to clipboard!');
}

// -----------------------------------------------------
// --- 2b. Join a Room (Customer-Only, via Link) ---
// -----------------------------------------------------
joinBtn.onclick = () => {
const user = getLoggedInUser();
if (user?.role !== 'user' || !currentRoom || !localStream) {
    updateStatus("Error: Only customers with a valid room link and active camera can join.");
    return;
}

isCaller = false;
joinBtn.disabled = true;
startBtn.disabled = true;

updateStatus(`Joining room **${currentRoom}**. Creating connection...`);

startCall(); 
socket.emit('join-room', currentRoom);
};

// -----------------------------------------------------
// --- 3. Start the WebRTC Call process ---
// -----------------------------------------------------
function startCall() {
if (peerConnection) {
    return;
}

peerConnection = new RTCPeerConnection(configuration);

localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
});

// Listen for remote tracks and display them
peerConnection.ontrack = event => {
    const user = getLoggedInUser();
    
    let targetVideoElement;
    if (user.role === 'seller') {
        // SELLER sees the PEER/CUSTOMER video on the LEFT/YOUR panel.
        targetVideoElement = localVideo;
    } else {
        // CUSTOMER sees the PEER/SELLER video on the RIGHT/PEER panel.
        targetVideoElement = remoteVideo;
    }
    
    if (!targetVideoElement.srcObject) {
        targetVideoElement.srcObject = event.streams[0];
        updateStatus("Remote stream received. Connection established!");
    }
};

// Handle ICE candidates
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { 
            candidate: event.candidate, 
            roomId: currentRoom 
        });
    }
};
}

// -----------------------------------------------------
// --- 4. Hang Up ---
// -----------------------------------------------------
hangupBtn.onclick = endCallCleanup;

document.addEventListener('DOMContentLoaded', initializeUI);

window.logout = window.logout || (() => {
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('currentSellerId');
window.location.href = 'shop-now.html';
}); 
