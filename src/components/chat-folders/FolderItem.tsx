
import { useState } from 'react';
import { 
  Folder, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  folder_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ChatFolder {
  id: string;
  name: string;
  icon_url: string | null;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface FolderItemProps {
  folder: ChatFolder;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (folderId: string, updates: Partial<ChatFolder>) => Promise<void>;
  onDelete: (folderId: string) => Promise<void>;
  onMoveChat: (chatId: string, folderId: string | null) => Promise<void>;
}

export function FolderItem({ 
  folder, 
  isExpanded, 
  onToggle, 
  onUpdate, 
  onDelete, 
  onMoveChat
}: FolderItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-800 transition-colors">
      <div
        onClick={onToggle}
        className="flex items-center flex-1 text-left cursor-pointer"
      >
        <div className="flex items-center flex-1">
          <Folder className="w-4 h-4 mr-2 text-yellow-500" />
          <span className="text-white font-medium">{folder.name}</span>
        </div>
        {isExpanded ? 
          <ChevronRight className="w-4 h-4 text-gray-400 transform rotate-90" /> : 
          <ChevronRight className="w-4 h-4 text-gray-400" />
        }
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
            <Pencil className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
          <DropdownMenuItem
            onClick={() => onDelete(folder.id)}
            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить папку
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
