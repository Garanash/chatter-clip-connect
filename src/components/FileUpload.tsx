
import { useState, useRef } from 'react';
import { Paperclip, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  attachedFiles: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUpload({ attachedFiles, onFilesChange, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB max
    });
    
    onFilesChange([...attachedFiles, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(attachedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => removeFile(index)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-10 w-10"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
