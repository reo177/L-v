import { useState } from 'react';

interface UserSetupProps {
  onRegister: (name: string, id: string, icon: string, textColor?: string, bgColor?: string) => void;
}

const ICONS = ['👤', '😀', '😎', '🤖', '🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🐵', '🦄', '🐝', '🦋'];

export default function UserSetup({ onRegister }: UserSetupProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👤');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#000000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && id.trim()) {
      onRegister(name.trim(), id.trim(), selectedIcon, textColor, bgColor);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="bg-gray-900 border-2 border-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          匿名チャットサイト
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              表示名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full px-4 py-2 bg-gray-800 border-2 border-white text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="あなたのID"
              className="w-full px-4 py-2 bg-gray-800 border-2 border-white text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              アイコン
            </label>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-2 rounded-lg transition-all border-2 ${
                    selectedIcon === icon
                      ? 'bg-white text-black border-white scale-110'
                      : 'bg-gray-800 border-white text-white hover:bg-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メッセージの色設定（オプション）
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">文字色</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10 border-2 border-white rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">背景色</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-10 border-2 border-white rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-2 p-3 rounded-lg border-2 border-white" style={{ backgroundColor: bgColor, color: textColor }}>
              <div className="font-semibold">プレビュー: これはあなたのメッセージの見え方です</div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all transform hover:scale-105"
          >
            チャットを始める
          </button>
        </form>
      </div>
    </div>
  );
}
