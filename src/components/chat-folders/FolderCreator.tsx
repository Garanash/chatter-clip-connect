
import { useState } from 'react';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FolderCreatorProps {
  onCreateFolder: (name: string) => Promise<void>;
}

export function FolderCreator({ onCreateFolder }: FolderCreatorProps) {
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setCreatingFolder(false);
    }
  };

  if (!creatingFolder) {
    return (
      <Button
        onClick={() => setCreatingFolder(true)}
        variant="ghost"
        className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl"
      >
        <Folder className="w-4 h-4 mr-2" />
        Создать папку
      </Button>
    );
  }

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
      <Button onClick={() => setCreatingFolder(false)} size="sm" variant="ghost">Отмена</Button>
    </div>
  );
}
