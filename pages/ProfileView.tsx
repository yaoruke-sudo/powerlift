
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, UserPhoto, UserProfile } from '../types';
import BottomNav from '../components/BottomNav';
import { fetchPhotos, fetchUserProfile, updateUserProfile, DEFAULT_USER_ID, createPhoto, deletePhoto, updatePhoto, fetchWorkouts } from '../services/api';

interface ProfileViewProps {
  onNavigate: (view: ViewState) => void;
  // 编辑资料后通知外部（例如 App）以便刷新统计数据
  onProfileUpdated?: (profile: UserProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, onProfileUpdated }) => {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  // 实际训练天数（基于去重的训练日期数量，而非连续天数）
  const [trainingDayCount, setTrainingDayCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ height: '175', weight: '70', name: 'User', avatarUrl: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // 头像选择器独立引用，避免与照片墙共用
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  // 正在编辑日期的照片 ID 和临时日期值
  const [editingDatePhotoId, setEditingDatePhotoId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState('');

  // 加载用户资料和照片
  useEffect(() => {
    fetchUserProfile(DEFAULT_USER_ID)
      .then(data => {
        setProfile(data);
        setEditForm({
          height: String(data.height),
          weight: String(data.weight),
          name: data.name || 'User',
          avatarUrl: data.avatar_url || ''
        });
      })
      .catch((err) => console.error('加载用户资料失败:', err));

    fetchPhotos(DEFAULT_USER_ID)
      .then(setPhotos)
      .catch((err) => console.error('加载照片失败:', err));

    // 统计实际训练天数：按日期去重，计算不同训练日数量
    fetchWorkouts(DEFAULT_USER_ID)
      .then(workouts => {
        const uniqueDates = new Set(workouts.map(w => w.date));
        setTrainingDayCount(uniqueDates.size);
      })
      .catch((err) => console.error('加载训练记录失败:', err));
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const h = parseFloat(editForm.height) || 0;
      const w = parseFloat(editForm.weight) || 0;
      const heightInM = h / 100;
      const bmi = heightInM > 0 ? Number((w / (heightInM * heightInM)).toFixed(1)) : 0;

      const updated = await updateUserProfile(profile.id, {
        height: h,
        weight: w,
        bmi,
        name: editForm.name,
        avatar_url: editForm.avatarUrl || undefined,
      });
      setProfile(updated);
      setIsEditing(false);
      onProfileUpdated?.(updated);
    } catch (err: any) {
      console.error('保存失败:', err);
      alert(`保存失败: ${err.message || '未知错误'}`);
    }
  };

  // 选择头像图片
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (url) {
        setEditForm(prev => ({ ...prev, avatarUrl: url }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 选择本地照片
  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const url = typeof reader.result === 'string' ? reader.result : '';
          if (!url) return;

          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const newPhoto = await createPhoto({
            user_id: DEFAULT_USER_ID,
            url,
            date: today,
            label: file.name,
          });

          // 新照片插在最前面
          setPhotos(prev => [newPhoto, ...prev]);
        } catch (err) {
          console.error('保存照片失败:', err);
          alert('保存照片失败，请重试');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('读取文件失败:', err);
      alert('读取照片失败，请重试');
    } finally {
      // 允许下次重新选择同一文件
      e.target.value = '';
    }
  };

  // 删除照片
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error('删除照片失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 开始编辑照片日期
  const handleStartEditDate = (photo: UserPhoto) => {
    setEditingDatePhotoId(photo.id);
    setEditingDateValue(photo.date);
  };

  // 保存编辑后的日期
  const handleSaveDate = async () => {
    if (!editingDatePhotoId || !editingDateValue) return;
    try {
      const updated = await updatePhoto(editingDatePhotoId, { date: editingDateValue });
      setPhotos(prev => prev.map(p => p.id === editingDatePhotoId ? { ...p, date: updated.date } : p));
      setEditingDatePhotoId(null);
    } catch (err) {
      console.error('更新日期失败:', err);
      alert('更新日期失败，请重试');
    }
  };

  // 训练天数直接使用 state 中统计的去重日期数

  return (
    <div className="flex flex-col h-full bg-background-dark overflow-hidden">
      <header className="px-8 pt-12 pb-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* 头像区域 —— 编辑模式下可点击更换，保留原始颜色 */}
            <div
              className={`w-20 h-20 rounded-3xl bg-surface-dark border-2 overflow-hidden shadow-2xl relative ${isEditing ? 'border-primary cursor-pointer' : 'border-primary/20'}`}
              onClick={() => isEditing && avatarInputRef.current?.click()}
            >
              <img
                src={(isEditing ? editForm.avatarUrl : profile?.avatar_url) || 'https://picsum.photos/seed/powerlift/200/200'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="material-icons-round text-white text-xl">photo_camera</span>
                </div>
              )}
            </div>
            {/* 隐藏的头像文件选择器 */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-black text-white bg-transparent border-b border-primary/40 focus:outline-none focus:border-primary w-full"
                  placeholder="输入名称"
                />
              ) : (
                <h1 className="text-2xl font-black text-white">
                  {profile?.name || '用户'} <span className="text-xs text-primary font-bold ml-1 uppercase">Pro</span>
                </h1>
              )}
              <p className="text-slate-500 text-xs font-bold tracking-widest mt-1">
                已训练 {trainingDayCount} 天
              </p>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl border ${isEditing ? 'bg-primary border-primary text-white' : 'bg-surface-dark border-white/5 text-slate-400'}`}
          >
            <span className="material-icons-round">{isEditing ? 'check' : 'edit'}</span>
          </button>
        </div>

        {/* Render editable stats if editing, otherwise hidden here (conceptually, but user wants edit UI) */}
        {isEditing && (
          <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-surface-dark rounded-2xl p-4 border border-white/10">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Height / 身高 (CM)</label>
              <input
                type="text"
                inputMode="numeric"
                value={editForm.height}
                onChange={e => setEditForm({ ...editForm, height: e.target.value.replace(/[^0-9]/g, '') })}
                className="bg-transparent text-2xl font-black text-white w-full focus:outline-none"
              />
            </div>
            <div className="bg-surface-dark rounded-2xl p-4 border border-white/10">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Weight / 体重 (KG)</label>
              <input
                type="text"
                inputMode="decimal"
                value={editForm.weight}
                onChange={e => setEditForm({ ...editForm, weight: e.target.value.replace(/[^0-9.]/g, '') })}
                className="bg-transparent text-2xl font-black text-white w-full focus:outline-none"
              />
            </div>
          </div>
        )}
      </header>


      <main className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-hide pb-32">
        {/* 照片墙 —— 从本地选择图片并保存在本地数据库 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">记忆照片墙</h2>
              <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest pt-1">GROWTH GALLERY</span>
            </div>
            <button
              type="button"
              onClick={handleAddPhotoClick}
              className="bg-primary/20 text-primary w-8 h-8 rounded-lg flex items-center justify-center"
            >
              <span className="material-icons-round text-sm">add_a_photo</span>
            </button>
            {/* 隐藏的本地图片选择器 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`relative group overflow-hidden rounded-3xl border border-white/5 shadow-xl transition-all duration-500 hover:scale-[1.02] ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
                    }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.label || ''}
                    className="w-full h-full object-cover transition-all duration-700"
                  />


                  {/* 底部信息 —— 日期突出显示，点击可编辑 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button
                      onClick={() => handleStartEditDate(photo)}
                      className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-lg px-2.5 py-1 mb-1.5 transition-colors hover:bg-primary/30"
                    >
                      <span className="material-icons-round text-primary text-xs">calendar_today</span>
                      <span className="text-xs text-primary font-black tracking-wide">{photo.date}</span>
                      <span className="material-icons-round text-primary/60 text-xs">edit</span>
                    </button>

                  </div>

                  {/* 右上角操作按钮 —— 删除 */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:bg-red-500 transition-colors"
                    >
                      <span className="material-icons-round text-xs">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              暂无照片，点击右上角相机按钮从本地导入一张训练照片。
            </div>
          )}
        </section>

        {/* 隐私政策入口 — vivo 审核要求应用内必须有可访问的隐私政策 */}
        <section>
          <button
            onClick={() => onNavigate('privacy')}
            className="w-full flex items-center justify-between bg-surface-dark rounded-2xl border border-white/5 px-5 py-4 group hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-slate-400 text-xl">privacy_tip</span>
              <span className="text-sm font-bold text-slate-300">隐私政策</span>
            </div>
            <span className="material-icons-round text-slate-500 text-lg group-hover:text-slate-300 transition-colors">chevron_right</span>
          </button>
        </section>
      </main>

      {/* 编辑日期弹窗 */}
      {editingDatePhotoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDatePhotoId(null)} />
          <div className="relative bg-surface-dark rounded-3xl border border-white/10 p-6 w-80 shadow-2xl">
            <h3 className="text-base font-black text-white mb-4">编辑照片日期</h3>
            <input
              type="date"
              value={editingDateValue}
              onChange={(e) => setEditingDateValue(e.target.value)}
              className="w-full bg-background-dark text-white border border-white/10 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-primary text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingDatePhotoId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 font-bold text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveDate}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
};

export default ProfileView;

