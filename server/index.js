import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ユーザー管理
const users = new Map(); // socketId -> user
const roomUsers = new Map(); // roomId -> Set of socketIds
const userRooms = new Map(); // socketId -> roomId
const blockedUsers = new Map(); // socketId -> Set of blocked userIds

// 4つの部屋を初期化
const ROOMS = ['room1', 'room2', 'room3', 'room4'];
ROOMS.forEach(roomId => {
  roomUsers.set(roomId, new Set());
});

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました:', socket.id);

  // ユーザー登録
  socket.on('register', (userData) => {
    const user = {
      id: userData.id || socket.id,
      name: userData.name || '匿名ユーザー',
      icon: userData.icon || '👤',
      textColor: userData.textColor,
      bgColor: userData.bgColor,
      socketId: socket.id
    };
    users.set(socket.id, user);
    blockedUsers.set(socket.id, new Set());
    socket.emit('registered', user);
    socket.emit('roomList', ROOMS);
    console.log('ユーザー登録:', user);
  });

  // 部屋に参加
  socket.on('joinRoom', (roomId) => {
    const currentRoom = userRooms.get(socket.id);
    if (currentRoom && currentRoom !== roomId) {
      // 前の部屋から退出
      const prevRoomUsers = roomUsers.get(currentRoom);
      if (prevRoomUsers) {
        prevRoomUsers.delete(socket.id);
        io.to(currentRoom).emit('roomUsers', Array.from(prevRoomUsers).map(sid => {
          const u = users.get(sid);
          return u ? { id: u.id, name: u.name, icon: u.icon, textColor: u.textColor, bgColor: u.bgColor, socketId: sid } : null;
        }).filter(Boolean));
      }
    }
    
    userRooms.set(socket.id, roomId);
    const roomUsersSet = roomUsers.get(roomId);
    if (roomUsersSet) {
      roomUsersSet.add(socket.id);
      socket.join(roomId);
      socket.emit('joinedRoom', roomId);
      
      // 部屋のユーザー一覧を送信
      const roomUsersList = Array.from(roomUsersSet)
        .map(sid => {
          const u = users.get(sid);
          return u ? { id: u.id, name: u.name, icon: u.icon, textColor: u.textColor, bgColor: u.bgColor, socketId: sid } : null;
        })
        .filter(Boolean);
      io.to(roomId).emit('roomUsers', roomUsersList);
      console.log(`ユーザー ${socket.id} が部屋 ${roomId} に参加`);
    }
  });

  // メッセージ送信
  socket.on('message', (messageData) => {
    const user = users.get(socket.id);
    const roomId = userRooms.get(socket.id);
    if (user && roomId) {
      const message = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userIcon: user.icon,
        userTextColor: user.textColor,
        userBgColor: user.bgColor,
        text: messageData.text,
        timestamp: new Date().toISOString(),
        roomId: roomId
      };
      io.to(roomId).emit('message', message);
      console.log('メッセージ:', message);
    }
  });

  // ブロック機能
  socket.on('blockUser', (targetUserId) => {
    const blockedSet = blockedUsers.get(socket.id);
    if (blockedSet) {
      blockedSet.add(targetUserId);
      socket.emit('userBlocked', targetUserId);
      console.log(`ユーザー ${socket.id} が ${targetUserId} をブロック`);
    }
  });

  socket.on('unblockUser', (targetUserId) => {
    const blockedSet = blockedUsers.get(socket.id);
    if (blockedSet) {
      blockedSet.delete(targetUserId);
      socket.emit('userUnblocked', targetUserId);
      console.log(`ユーザー ${socket.id} が ${targetUserId} のブロックを解除`);
    }
  });

  socket.on('getBlockedUsers', () => {
    const blockedSet = blockedUsers.get(socket.id);
    socket.emit('blockedUsers', Array.from(blockedSet || []));
  });

  // ユーザー設定更新（色情報）
  socket.on('updateUserSettings', (settings) => {
    const user = users.get(socket.id);
    if (user) {
      user.textColor = settings.textColor;
      user.bgColor = settings.bgColor;
      users.set(socket.id, user);
      
      // 部屋内の他のユーザーに更新を通知
      const roomId = userRooms.get(socket.id);
      if (roomId) {
        const roomUsersSet = roomUsers.get(roomId);
        if (roomUsersSet) {
          const roomUsersList = Array.from(roomUsersSet)
            .map(sid => {
              const u = users.get(sid);
              return u ? { id: u.id, name: u.name, icon: u.icon, textColor: u.textColor, bgColor: u.bgColor, socketId: sid } : null;
            })
            .filter(Boolean);
          io.to(roomId).emit('roomUsers', roomUsersList);
        }
      }
    }
  });

  // 通話開始（シグナリング）- 部屋内でのみ
  socket.on('call-offer', (data) => {
    const user = users.get(socket.id);
    const roomId = userRooms.get(socket.id);
    if (user && roomId) {
      io.to(data.targetSocketId).emit('call-offer', {
        offer: data.offer,
        roomId: roomId,
        from: {
          socketId: socket.id,
          userId: user.id,
          userName: user.name,
          userIcon: user.icon
        }
      });
    }
  });

  socket.on('call-answer', (data) => {
    io.to(data.targetSocketId).emit('call-answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('call-ice-candidate', (data) => {
    io.to(data.targetSocketId).emit('call-ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('call-end', (data) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('call-end', { from: socket.id });
    }
  });

  // 切断
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    const roomId = userRooms.get(socket.id);
    
    if (user) {
      users.delete(socket.id);
      blockedUsers.delete(socket.id);
      userRooms.delete(socket.id);
      
      if (roomId) {
        const roomUsersSet = roomUsers.get(roomId);
        if (roomUsersSet) {
          roomUsersSet.delete(socket.id);
          const roomUsersList = Array.from(roomUsersSet)
            .map(sid => {
              const u = users.get(sid);
              return u ? { id: u.id, name: u.name, icon: u.icon, textColor: u.textColor, bgColor: u.bgColor, socketId: sid } : null;
            })
            .filter(Boolean);
          io.to(roomId).emit('roomUsers', roomUsersList);
        }
      }
      
      io.emit('userDisconnected', { socketId: socket.id });
      console.log('ユーザーが切断しました:', user.name);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

