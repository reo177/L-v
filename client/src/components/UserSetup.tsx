import { useState, useRef } from 'react';

interface UserSetupProps {
  onRegister: (name: string, id: string, icon: string, textColor?: string, bgColor?: string) => void;
}

export default function UserSetup({ onRegister }: UserSetupProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#000000');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください');
        return;
      }

      // 画像形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setIconPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && id.trim() && iconPreview) {
      onRegister(name.trim(), id.trim(), iconPreview, textColor, bgColor);
    } else if (!iconPreview) {
      alert('アイコン画像を選択してください');
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
              アイコン画像
            </label>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-white text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                画像を選択
              </button>
              {iconPreview && (
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-2">プレビュー:</div>
                  <div className="flex items-center gap-4">
                    <img
                      src={iconPreview}
                      alt="アイコンプレビュー"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIconPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ※ 画像サイズは5MB以下、対応形式: JPG, PNG, GIF, WebP
            </p>
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
