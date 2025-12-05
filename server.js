// server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Ayarlar ---
app.use(express.json());
app.use(express.static('public')); // Frontend dosyaları burada olacak
app.use('/uploads', express.static('uploads')); // Dosyalar için

// Upload Klasörü Oluşturma
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// Multer Ayarı (Dosya Yükleme)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- MongoDB Bağlantısı ---
// Not: Aşağıdaki URL'yi kendi yerel veya Atlas MongoDB URL'niz ile değiştirin.
mongoose.connect('mongodb://127.0.0.1:27017/chatdb')
    .then(() => console.log('MongoDB Bağlandı'))
    .catch(err => console.error('MongoDB Hatası:', err));

// --- Veritabanı Şemaları ---
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Oda şifresi
    creator: String
});
const Room = mongoose.model('Room', RoomSchema);

// --- API Rotaları ---

// 1. Kayıt Ol
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hashedPassword });
        await user.save();
        res.json({ success: true, message: 'Kayıt başarılı!' });
    } catch (e) {
        res.json({ success: false, message: 'Kullanıcı adı alınmış.' });
    }
});

// 2. Giriş Yap
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.json({ success: true, username: user.username });
    } else {
        res.json({ success: false, message: 'Hatalı bilgiler.' });
    }
});

// 3. Oda Oluştur
app.post('/create-room', async (req, res) => {
    try {
        const room = new Room({
            name: req.body.name,
            password: req.body.password,
            creator: req.body.creator
        });
        await room.save();
        res.json({ success: true, message: 'Oda oluşturuldu.' });
    } catch (e) {
        res.json({ success: false, message: 'Oda ismi zaten var.' });
    }
});

// 4. Odaya Giriş Kontrolü (Şifre Doğrulama)
app.post('/join-room', async (req, res) => {
    const room = await Room.findOne({ name: req.body.name });
    if (room && room.password === req.body.password) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Oda bulunamadı veya şifre yanlış.' });
    }
});

// 5. Dosya Yükleme
app.post('/upload', upload.single('file'), (req, res) => {
    if(req.file) {
        res.json({ success: true, fileUrl: `/uploads/${req.file.filename}`, fileName: req.file.originalname, type: req.file.mimetype });
    } else {
        res.json({ success: false });
    }
});

// --- Socket.io (Real-Time Chat) ---
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı: ' + socket.id);

    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        // Odaya birinin katıldığını bildir
        socket.to(room).emit('message', { 
            user: 'Sistem', 
            text: `${username} odaya katıldı.`, 
            type: 'text' 
        });
    });

    socket.on('chatMessage', ({ room, user, text, type, fileUrl }) => {
        // Mesajı odadaki herkese gönder
        io.to(room).emit('message', { user, text, type, fileUrl });
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı.');
    });
});

// Sunucuyu Başlat
server.listen(3000, () => {
    console.log('Sunucu http://localhost:3000 adresinde çalışıyor.');
});