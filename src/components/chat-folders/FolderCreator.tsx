
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FolderCreatorProps {
  onCreateFolder: (name: string, color?: string, iconUrl?: string) => Promise<void>;
  onCancel: () => void;
}

export function FolderCreator({ onCreateFolder, onCancel }: FolderCreatorProps) {
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        placeholder="Название папки"
        className="bg-gray-800 border-gray-700 text-white"
        onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
      />
      <Button onClick={handleCreateFolder} size="sm">Создать</Button>
      <Button onClick={onCancel} size="sm" variant="ghost">Отмена</Button>
    </div>
  );
}
