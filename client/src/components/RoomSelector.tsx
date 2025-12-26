import { useState } from 'react';

interface User {
  id: string;
  name: string;
  icon: string;
  socketId: string;
}

interface RoomSelectorProps {
  rooms: string[];
  onJoinRoom: (roomId: string) => void;
  user: User;
}

const ROOM_NAMES: { [key: string]: string } = {
  room1: '部屋1',
  room2: '部屋2',
  room3: '部屋3',
  room4: '部屋4'
};

export default function RoomSelector({ rooms, onJoinRoom, user }: RoomSelectorProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="bg-gray-900 border-2 border-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">部屋を選択</h1>
          <div className="flex items-center justify-center gap-4 text-white bg-gray-800 border-2 border-white rounded-lg p-4 inline-flex">
            <span className="text-3xl">{user.icon}</span>
            <div className="text-left">
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm text-gray-400">ID: {user.id}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {rooms.map((roomId) => (
            <button
              key={roomId}
              onClick={() => {
                setSelectedRoom(roomId);
                onJoinRoom(roomId);
              }}
              className={`p-8 border-4 rounded-2xl transition-all transform hover:scale-105 ${
                selectedRoom === roomId
                  ? 'border-white bg-white text-black shadow-2xl'
                  : 'border-gray-600 bg-gray-800 text-white hover:border-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="text-5xl mb-4">🚪</div>
              <div className="font-bold text-2xl mb-2">{ROOM_NAMES[roomId] || roomId}</div>
              <div className={`text-sm mt-2 ${selectedRoom === roomId ? 'text-gray-700' : 'text-gray-400'}`}>
                クリックして入室
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 border-2 border-white rounded-lg">
          <p className="text-center text-gray-300 text-sm">
            💡 ヒント: 4つの部屋から好きな部屋を選んでチャットを始めましょう
          </p>
        </div>
      </div>
    </div>
  );
}

