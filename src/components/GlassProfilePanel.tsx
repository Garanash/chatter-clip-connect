
import { useState, useEffect } from 'react';
import { X, User, Edit2, Camera, Save, Calendar, MapPin, Globe, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GlassProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlassProfilePanel({ isOpen, onClose }: GlassProfilePanelProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    location: '',
    birth_date: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
        birth_date: profile.birth_date || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">Личный кабинет</h2>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Save className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">
                  {formData.nickname || formData.first_name || 'Пользователь'}
                </h3>
                <p className="text-white/70">{formData.email}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Никнейм</label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите никнейм"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Имя</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите имя"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Фамилия</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите фамилию"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Телефон
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите телефон"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Дата рождения
                </label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Местоположение
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите местоположение"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Веб-сайт
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  disabled={!isEditing}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Введите URL сайта"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                О себе
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                disabled={!isEditing}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Расскажите о себе"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
