import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatRoom from './components/ChatRoom';
import UserSetup from './components/UserSetup';
import VoiceCall from './components/VoiceCall';
import RoomSelector from './components/RoomSelector';
import Menu from './components/Menu';

interface User {
  id: string;
  name: string;
  icon: string;
  socketId: string;
  textColor?: string;
  bgColor?: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userIcon: string;
  text: string;
  timestamp: string;
  roomId?: string;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callPartner, setCallPartner] = useState<User | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('registered', (userData: User) => {
      setUser(userData);
    });

    newSocket.on('roomList', (roomList: string[]) => {
      setRooms(roomList);
    });

    newSocket.on('joinedRoom', (roomId: string) => {
      setCurrentRoom(roomId);
      setMessages([]); // 部屋を変えたらメッセージをクリア
    });

    newSocket.on('roomUsers', (userList: User[]) => {
      setUsers(userList.filter(u => u.socketId !== newSocket.id));
    });

    newSocket.on('message', (message: Message) => {
      // ブロックされたユーザーのメッセージは表示しない
      if (!blockedUsers.has(message.userId)) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('userDisconnected', ({ socketId }: { socketId: string }) => {
      setUsers(prev => prev.filter(u => u.socketId !== socketId));
    });

    newSocket.on('userBlocked', (userId: string) => {
      setBlockedUsers(prev => new Set(prev).add(userId));
    });

    newSocket.on('userUnblocked', (userId: string) => {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('blockedUsers', (userIds: string[]) => {
      setBlockedUsers(new Set(userIds));
    });

    return () => {
      newSocket.close();
    };
  }, [blockedUsers]);

  const handleRegister = (name: string, id: string, icon: string, textColor?: string, bgColor?: string) => {
    if (socket) {
      socket.emit('register', { name, id, icon, textColor, bgColor });
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const handleSendMessage = (text: string) => {
    if (socket && user && currentRoom) {
      socket.emit('message', { text });
    }
  };

  const handleStartCall = (targetUser: User) => {
    setCallPartner(targetUser);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallPartner(null);
  };

  const handleBlockUser = (userId: string) => {
    if (socket) {
      socket.emit('blockUser', userId);
      setMessages(prev => prev.filter(m => m.userId !== userId));
    }
  };

  const handleUnblockUser = (userId: string) => {
    if (socket) {
      socket.emit('unblockUser', userId);
    }
  };

  const handleUpdateUserSettings = (textColor?: string, bgColor?: string) => {
    if (user) {
      setUser({ ...user, textColor, bgColor });
    }
  };

  const handleGetBlockedUsers = () => {
    if (socket) {
      socket.emit('getBlockedUsers');
    }
  };

  if (!user) {
    return <UserSetup onRegister={handleRegister} />;
  }

  if (!currentRoom) {
    return <RoomSelector rooms={rooms} onJoinRoom={handleJoinRoom} user={user} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex relative">
        <ChatRoom
          user={user}
          users={users}
          messages={messages}
          currentRoom={currentRoom}
          onSendMessage={handleSendMessage}
          onStartCall={handleStartCall}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          blockedUsers={blockedUsers}
          socket={socket}
        />
        {isCallActive && callPartner && socket && (
          <VoiceCall
            socket={socket}
            user={user}
            partner={callPartner}
            onEndCall={handleEndCall}
          />
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="fixed top-4 right-4 z-50 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ☰ メニュー
        </button>
        {showMenu && (
          <Menu
            user={user}
            currentRoom={currentRoom}
            onLeaveRoom={() => {
              setCurrentRoom(null);
              setMessages([]);
            }}
            onUpdateSettings={handleUpdateUserSettings}
            blockedUsers={blockedUsers}
            onGetBlockedUsers={handleGetBlockedUsers}
            onUnblockUser={handleUnblockUser}
            onClose={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
