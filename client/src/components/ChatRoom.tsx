import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';

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

interface ChatRoomProps {
  user: User;
  users: User[];
  messages: Message[];
  currentRoom: string;
  onSendMessage: (text: string) => void;
  onStartCall: (targetUser: User) => void;
  onBlockUser: (userId: string) => void;
  blockedUsers: Set<string>;
  socket: Socket | null;
}

const ROOM_NAMES: { [key: string]: string } = {
  room1: '部屋1',
  room2: '部屋2',
  room3: '部屋3',
  room4: '部屋4'
};

export default function ChatRoom({
  user,
  users,
  messages,
  currentRoom,
  onSendMessage,
  onStartCall,
  onBlockUser,
  blockedUsers
}: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const filteredMessages = searchText
    ? messages.filter(m => 
        !blockedUsers.has(m.userId) && 
        m.text.toLowerCase().includes(searchText.toLowerCase())
      )
    : messages.filter(m => !blockedUsers.has(m.userId));

  const filteredUsers = searchText
    ? users.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase()) || u.id.toLowerCase().includes(searchText.toLowerCase()))
    : users;

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      {/* ヘッダー */}
      <div className="bg-gray-900 border-b-2 border-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{user.icon}</span>
            <div>
              <h2 className="font-bold text-lg text-white">{user.name}</h2>
              <p className="text-sm text-gray-400">ID: {user.id} | {ROOM_NAMES[currentRoom] || currentRoom}</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            オンライン: {users.length + 1}人
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* メッセージエリア */}
        <div className="flex-1 flex flex-col">
          {/* 検索バー */}
          <div className="p-2 bg-gray-900 border-b border-white">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="メッセージ・ユーザーを検索..."
              className="w-full px-4 py-2 bg-gray-800 border-2 border-white text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchText ? '検索結果がありません' : 'メッセージがありません'}
              </div>
            ) : (
              filteredMessages.map((message) => {
                const isOwnMessage = message.userId === user.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center text-xl">
                        {message.userIcon}
                      </div>
                    </div>
                    <div
                      className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : ''}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-white text-black'
                            : 'bg-gray-800 border-2 border-white text-white'
                        }`}
                        style={
                          isOwnMessage && user.textColor && user.bgColor
                            ? {
                                backgroundColor: user.bgColor,
                                color: user.textColor
                              }
                            : {}
                        }
                      >
                        {!isOwnMessage && (
                          <div className="font-semibold text-sm mb-1 flex items-center justify-between">
                            <span>{message.userName}</span>
                            <button
                              onClick={() => onBlockUser(message.userId)}
                              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                              title="ブロック"
                            >
                              🚫
                            </button>
                          </div>
                        )}
                        <div className="text-sm break-words">{message.text}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 px-2">
                        {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力 */}
          <form onSubmit={handleSubmit} className="p-4 border-t-2 border-white bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2 bg-gray-800 border-2 border-white text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                送信
              </button>
            </div>
          </form>
        </div>

        {/* ユーザーリスト */}
        <div className="w-64 border-l-2 border-white bg-gray-900 overflow-y-auto">
          <div className="p-4 border-b-2 border-white bg-gray-900 sticky top-0">
            <h3 className="font-semibold text-white">オンラインユーザー ({filteredUsers.length})</h3>
          </div>
          <div className="p-2 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">ユーザーがいません</div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.socketId}
                  className="flex items-center gap-3 p-3 bg-gray-800 border-2 border-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="text-2xl">{u.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white truncate">{u.name}</div>
                    <div className="text-xs text-gray-400 truncate">ID: {u.id}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onStartCall(u)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      title="通話を開始"
                    >
                      📞
                    </button>
                    <button
                      onClick={() => onBlockUser(u.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      title="ブロック"
                    >
                      🚫
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
