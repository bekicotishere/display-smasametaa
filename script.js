// Data operator
const operators = [
    { id: 1, name: "Operator 1", description: "Pendaftaran", status: "active" },
    { id: 2, name: "Operator 2", description: "Administrasi", status: "waiting" },
    { id: 3, name: "Operator 3", description: "Berkas", status: "active" },
    { id: 4, name: "Operator 4", description: "Verifikasi", status: "active" },
    { id: 5, name: "Operator 5", description: "Wawancara", status: "inactive" },
    { id: 6, name: "Operator 6", description: "Tes Akademik", status: "waiting" },
    { id: 7, name: "Operator 7", description: "Konseling", status: "active" },
    { id: 8, name: "Operator 8", description: "Pengumuman", status: "inactive" }
];

// Data antrian
let queueHistory = [];
let nextQueueList = [];

// Elemen DOM
const queueNumberInput = document.getElementById('queue-number');
const operatorSelect = document.getElementById('operator-select');
const callButton = document.getElementById('call-btn');
const resetButton = document.getElementById('reset-btn');
const soundTestButton = document.getElementById('sound-test-btn');
const increaseBtn = document.getElementById('increase-btn');
const decreaseBtn = document.getElementById('decrease-btn');
const lastQueueNumber = document.getElementById('last-queue-number');
const lastOperator = document.getElementById('last-operator');
const lastCallTime = document.getElementById('last-call-time');
const currentQueue = document.getElementById('current-queue');
const currentOperator = document.getElementById('current-operator');
const operatorsContainer = document.getElementById('operators-container');
const historyList = document.getElementById('history-list');
const nextQueueListElement = document.getElementById('next-queue-list');
const callSound = document.getElementById('call-sound');
const beepSound = document.getElementById('beep-sound');
const dateElement = document.getElementById('date');
const timeElement = document.getElementById('time');

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    // Setup operator display
    renderOperators();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup datetime
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Setup audio untuk suara panggilan
    setupSpeechSynthesis();
    
    // Load data dari localStorage jika ada
    loadFromLocalStorage();
});

// Render operator cards
function renderOperators() {
    operatorsContainer.innerHTML = '';
    
    operators.forEach(operator => {
        const operatorCard = document.createElement('div');
        operatorCard.className = `operator-card ${operator.status}`;
        
        let statusText = "";
        let statusClass = "";
        
        switch(operator.status) {
            case "active":
                statusText = "Siap";
                statusClass = "status-active";
                break;
            case "waiting":
                statusText = "Menunggu";
                statusClass = "status-waiting";
                break;
            case "inactive":
                statusText = "Tidak Aktif";
                statusClass = "status-inactive";
                break;
        }
        
        operatorCard.innerHTML = `
            <div class="operator-icon">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="operator-info">
                <h4>${operator.name}</h4>
                <p>${operator.description}</p>
                <span class="operator-status ${statusClass}">${statusText}</span>
            </div>
        `;
        
        operatorsContainer.appendChild(operatorCard);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tombol panggil antrian
    callButton.addEventListener('click', callQueue);
    
    // Tombol reset antrian
    resetButton.addEventListener('click', resetQueue);
    
    // Tombol tes suara
    soundTestButton.addEventListener('click', testSound);
    
    // Tombol tambah dan kurang nomor antrian
    increaseBtn.addEventListener('click', () => {
        queueNumberInput.value = parseInt(queueNumberInput.value) + 1;
    });
    
    decreaseBtn.addEventListener('click', () => {
        if (parseInt(queueNumberInput.value) > 1) {
            queueNumberInput.value = parseInt(queueNumberInput.value) - 1;
        }
    });
    
    // Validasi input nomor antrian
    queueNumberInput.addEventListener('change', function() {
        if (this.value < 1) this.value = 1;
    });
}

// Fungsi panggil antrian
function callQueue() {
    // Dapatkan nomor antrian dan operator
    const queueNumber = queueNumberInput.value;
    const operatorId = operatorSelect.value;
    const operatorText = operatorSelect.options[operatorSelect.selectedIndex].text;
    
    // Update tampilan antrian terpanggil
    lastQueueNumber.textContent = queueNumber;
    lastOperator.textContent = operatorText;
    
    // Update waktu panggilan
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    lastCallTime.textContent = timeString;
    
    // Update tampilan publik
    currentQueue.textContent = queueNumber;
    currentOperator.textContent = operatorText;
    
    // Tambahkan ke riwayat
    addToHistory(queueNumber, operatorText, timeString);
    
    // Tambahkan ke daftar antrian berikutnya (jika belum ada)
    if (!nextQueueList.includes(queueNumber)) {
        nextQueueList.push(queueNumber);
        updateNextQueueList();
    }
    
    // Mainkan suara panggilan
    playCallSound(queueNumber, operatorText);
    
    // Mainkan suara beep
    playBeepSound();
    
    // Simpan ke localStorage
    saveToLocalStorage();
    
    // Update status operator (acak untuk simulasi)
    updateRandomOperatorStatus();
}

// Fungsi reset antrian
function resetQueue() {
    if (confirm("Apakah Anda yakin ingin mereset antrian? Riwayat akan dihapus.")) {
        // Reset input
        queueNumberInput.value = 1;
        
        // Reset tampilan
        lastQueueNumber.textContent = "-";
        lastOperator.textContent = "Belum ada panggilan";
        lastCallTime.textContent = "-";
        currentQueue.textContent = "---";
        currentOperator.textContent = "---";
        
        // Reset riwayat dan antrian berikutnya
        queueHistory = [];
        nextQueueList = [];
        
        // Update tampilan
        updateHistoryList();
        updateNextQueueList();
        
        // Simpan ke localStorage
        saveToLocalStorage();
        
        // Notifikasi
        alert("Antrian telah direset.");
    }
}

// Fungsi tes suara
function testSound() {
    const testText = "Ini adalah tes suara sistem antrian SPMB SMA Negeri 1 Magetan";
    speakText(testText);
    
    // Tampilkan pesan
    alert("Tes suara sedang diputar. Pastikan volume speaker Anda aktif.");
}

// Fungsi tambah ke riwayat
function addToHistory(queueNumber, operatorText, timeString) {
    queueHistory.unshift({
        queueNumber,
        operatorText,
        timeString
    });
    
    // Batasi riwayat hingga 10 item
    if (queueHistory.length > 10) {
        queueHistory.pop();
    }
    
    updateHistoryList();
}

// Update tampilan riwayat
function updateHistoryList() {
    historyList.innerHTML = '';
    
    if (queueHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">Belum ada riwayat panggilan</div>';
        return;
    }
    
    queueHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-queue">Antrian ${item.queueNumber}</div>
            <div class="history-operator">${item.operatorText}</div>
            <div class="history-time">${item.timeString}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Update daftar antrian berikutnya
function updateNextQueueList() {
    nextQueueListElement.innerHTML = '';
    
    if (nextQueueList.length === 0) {
        nextQueueListElement.innerHTML = '<div class="next-empty">Belum ada antrian berikutnya</div>';
        return;
    }
    
    // Tampilkan maksimal 4 antrian berikutnya
    const displayQueue = nextQueueList.slice(0, 4);
    
    displayQueue.forEach(queueNum => {
        const nextItem = document.createElement('div');
        nextItem.className = 'next-item';
        
        // Cari operator untuk antrian ini dari riwayat
        const queueItem = queueHistory.find(item => item.queueNumber == queueNum);
        const operatorForQueue = queueItem ? queueItem.operatorText : "Operator";
        
        nextItem.innerHTML = `
            <div class="next-number">${queueNum}</div>
            <div class="next-operator">${operatorForQueue}</div>
        `;
        
        nextQueueListElement.appendChild(nextItem);
    });
}

// Setup Web Speech API
function setupSpeechSynthesis() {
    // Cek dukungan browser
    if (!('speechSynthesis' in window)) {
        alert("Browser Anda tidak mendukung fitur Text-to-Speech. Suara panggilan tidak akan berfungsi.");
        return;
    }
}

// Mainkan suara panggilan
function playCallSound(queueNumber, operatorText) {
    // Format teks untuk diucapkan
    const textToSpeak = `Nomor antrian ${queueNumber}, silakan menuju ${operatorText}`;
    
    // Gunakan Web Speech API
    speakText(textToSpeak);
}

// Fungsi untuk berbicara teks
function speakText(text) {
    // Hentikan bicara yang sedang berlangsung
    window.speechSynthesis.cancel();
    
    // Buat objek SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Atur bahasa dan suara
    utterance.lang = 'id-ID';
    utterance.rate = 1.0; // Kecepatan bicara
    utterance.pitch = 1.0; // Nada suara
    utterance.volume = 1.0; // Volume
    
    // Coba set suara wanita jika tersedia
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
    );
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    // Mulai berbicara
    window.speechSynthesis.speak(utterance);
}

// Mainkan suara beep
function playBeepSound() {
    beepSound.currentTime = 0;
    beepSound.play().catch(e => {
        console.log("Tidak dapat memutar suara beep:", e);
    });
}

// Update tanggal dan waktu
function updateDateTime() {
    const now = new Date();
    
    // Format tanggal
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', optionsDate);
    dateElement.textContent = dateString;
    
    // Format waktu
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    timeElement.textContent = timeString;
}

// Update status operator secara acak (untuk simulasi)
function updateRandomOperatorStatus() {
    // Pilih operator secara acak untuk diubah statusnya
    const randomIndex = Math.floor(Math.random() * operators.length);
    const statuses = ["active", "waiting", "inactive"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    operators[randomIndex].status = randomStatus;
    
    // Render ulang operator
    renderOperators();
}

// Simpan data ke localStorage
function saveToLocalStorage() {
    const data = {
        queueHistory,
        nextQueueList,
        lastQueue: lastQueueNumber.textContent,
        lastOperator: lastOperator.textContent,
        lastCallTime: lastCallTime.textContent,
        currentQueue: currentQueue.textContent,
        currentOperator: currentOperator.textContent,
        queueNumber: queueNumberInput.value
    };
    
    localStorage.setItem('spmbQueueData', JSON.stringify(data));
}

// Load data dari localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('spmbQueueData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        
        queueHistory = data.queueHistory || [];
        nextQueueList = data.nextQueueList || [];
        
        lastQueueNumber.textContent = data.lastQueue || "-";
        lastOperator.textContent = data.lastOperator || "Belum ada panggilan";
        lastCallTime.textContent = data.lastCallTime || "-";
        currentQueue.textContent = data.currentQueue || "---";
        currentOperator.textContent = data.currentOperator || "---";
        queueNumberInput.value = data.queueNumber || 1;
        
        updateHistoryList();
        updateNextQueueList();
    }
}

// Tambahan: Event listener untuk Enter key pada input
queueNumberInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        callQueue();
    }
});