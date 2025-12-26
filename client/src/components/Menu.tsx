import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  icon: string;
  socketId: string;
  textColor?: string;
  bgColor?: string;
}

interface MenuProps {
  user: User;
  currentRoom: string;
  onLeaveRoom: () => void;
  onUpdateSettings: (textColor?: string, bgColor?: string) => void;
  blockedUsers: Set<string>;
  onGetBlockedUsers: () => void;
  onUnblockUser: (userId: string) => void;
  onClose: () => void;
}

const ROOM_NAMES: { [key: string]: string } = {
  room1: '部屋1',
  room2: '部屋2',
  room3: '部屋3',
  room4: '部屋4'
};

const PRESET_COLORS = [
  { name: '白', text: '#FFFFFF', bg: '#000000' },
  { name: '黒', text: '#000000', bg: '#FFFFFF' },
  { name: '赤', text: '#FF0000', bg: '#000000' },
  { name: '青', text: '#0000FF', bg: '#FFFFFF' },
  { name: '緑', text: '#00FF00', bg: '#000000' },
  { name: '黄', text: '#FFFF00', bg: '#000000' },
  { name: '紫', text: '#FF00FF', bg: '#000000' },
  { name: 'シアン', text: '#00FFFF', bg: '#000000' },
];

export default function Menu({
  user,
  currentRoom,
  onLeaveRoom,
  onUpdateSettings,
  blockedUsers,
  onGetBlockedUsers,
  onUnblockUser,
  onClose
}: MenuProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'blocked' | 'info'>('settings');
  const [textColor, setTextColor] = useState(user.textColor || '#FFFFFF');
  const [bgColor, setBgColor] = useState(user.bgColor || '#000000');
  const [customTextColor, setCustomTextColor] = useState('');
  const [customBgColor, setCustomBgColor] = useState('');

  useEffect(() => {
    onGetBlockedUsers();
  }, []);

  const handleApplyColors = () => {
    onUpdateSettings(textColor, bgColor);
  };

  const handlePresetColor = (text: string, bg: string) => {
    setTextColor(text);
    setBgColor(bg);
    onUpdateSettings(text, bg);
  };

  const handleCustomColor = () => {
    if (customTextColor && customBgColor) {
      setTextColor(customTextColor);
      setBgColor(customBgColor);
      onUpdateSettings(customTextColor, customBgColor);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gray-900 border-b-2 border-white p-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">メニュー</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-400 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b-2 border-white">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            設定
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'blocked'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            ブロック ({blockedUsers.size})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'info'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            情報
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">メッセージの色設定</h3>
                
                {/* プリセット色 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">プリセット色</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePresetColor(preset.text, preset.bg)}
                        className="p-3 border-2 border-white rounded-lg hover:bg-gray-800 transition-colors"
                        style={{ backgroundColor: preset.bg, color: preset.text }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* カスタム色 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">カスタム色</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">文字色</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value);
                            onUpdateSettings(e.target.value, bgColor);
                          }}
                          className="w-16 h-10 border-2 border-white rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customTextColor}
                          onChange={(e) => setCustomTextColor(e.target.value)}
                          placeholder="#FFFFFF"
                          className="flex-1 px-3 py-2 bg-gray-800 border-2 border-white text-white rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">背景色</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value);
                            onUpdateSettings(textColor, e.target.value);
                          }}
                          className="w-16 h-10 border-2 border-white rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customBgColor}
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 bg-gray-800 border-2 border-white text-white rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCustomColor}
                    className="mt-2 w-full py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    カスタム色を適用
                  </button>
                </div>

                {/* プレビュー */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">プレビュー</label>
                  <div
                    className="p-4 rounded-lg border-2 border-white"
                    style={{ backgroundColor: bgColor, color: textColor }}
                  >
                    <div className="font-semibold mb-1">{user.name}</div>
                    <div>これはあなたのメッセージの見え方です</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-white">
                <button
                  onClick={onLeaveRoom}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  部屋を退出
                </button>
              </div>
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">ブロック済みユーザー</h3>
              {blockedUsers.size === 0 ? (
                <p className="text-gray-400 text-center py-8">ブロック済みユーザーはいません</p>
              ) : (
                <div className="space-y-2">
                  {Array.from(blockedUsers).map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-4 bg-gray-800 border-2 border-white rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-white">ID: {userId}</div>
                      </div>
                      <button
                        onClick={() => onUnblockUser(userId)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ブロック解除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">情報</h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-800 border-2 border-white rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">現在の部屋</div>
                  <div className="text-lg font-semibold text-white">{ROOM_NAMES[currentRoom] || currentRoom}</div>
                </div>
                <div className="p-4 bg-gray-800 border-2 border-white rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">あなたのID</div>
                  <div className="text-lg font-semibold text-white">{user.id}</div>
                </div>
                <div className="p-4 bg-gray-800 border-2 border-white rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">あなたの名前</div>
                  <div className="text-lg font-semibold text-white">{user.name}</div>
                </div>
                <div className="p-4 bg-gray-800 border-2 border-white rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">あなたのアイコン</div>
                  <div className="text-3xl">{user.icon}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

