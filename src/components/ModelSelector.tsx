
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Model {
  id: string;
  name: string;
  category: string;
}

const models: Model[] = [
  { id: 'vis-google/gemini-2.5-pro-preview', name: 'Google: Gemini 2.5 Pro Preview (vision)', category: 'Google' },
  { id: 'mistralai/devstral-small', name: 'Mistral: Devstral Small', category: 'Mistral' },
  { id: 'openai/o3', name: 'OpenAI: o3', category: 'OpenAI' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Google: Gemini 2.5 Pro Preview', category: 'Google' },
  { id: 'anthropic/claude-opus-4', name: 'Anthropic: Claude Opus 4', category: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4', name: 'Anthropic: Claude Sonnet 4', category: 'Anthropic' },
  { id: 'google/gemini-2.5-flash-pre', name: 'Google: Gemini 2.5 Flash Preview', category: 'Google' },
  { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1', category: 'OpenAI' },
  { id: 'openai/gpt-4.1-mini', name: 'OpenAI: GPT-4.1 Mini', category: 'OpenAI' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', category: 'Meta' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen2.5 72B Instruct', category: 'Qwen' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', category: 'DeepSeek' }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const { toast } = useToast();

  const handleModelChange = (newModel: string) => {
    if (newModel !== selectedModel) {
      onModelChange(newModel);
      toast({
        title: "Модель изменена",
        description: `Переключение на ${models.find(m => m.id === newModel)?.name}`,
      });
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
      <Settings className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600 font-medium">Модель:</span>
      <Select value={selectedModel} onValueChange={handleModelChange} disabled={disabled}>
        <SelectTrigger className="w-[320px] bg-white border-gray-300 text-gray-700 text-sm h-9">
          <SelectValue placeholder="Выберите модель">
            {selectedModelInfo?.name || 'Выберите модель'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-80">
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-gray-700 hover:bg-gray-100">
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-500">{model.category}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {disabled && (
        <span className="text-xs text-gray-500">Смена модели...</span>
      )}
    </div>
  );
}
