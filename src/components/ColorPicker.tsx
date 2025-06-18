
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';

const colors = [
  { name: 'Синий', value: '#3B82F6' },
  { name: 'Зеленый', value: '#10B981' },
  { name: 'Красный', value: '#EF4444' },
  { name: 'Желтый', value: '#F59E0B' },
  { name: 'Фиолетовый', value: '#8B5CF6' },
  { name: 'Розовый', value: '#EC4899' },
  { name: 'Индиго', value: '#6366F1' },
  { name: 'Оранжевый', value: '#F97316' },
  { name: 'Изумрудный', value: '#059669' },
  { name: 'Голубой', value: '#06B6D4' },
  { name: 'Лайм', value: '#84CC16' },
  { name: 'Серый', value: '#6B7280' }
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 border-2"
          style={{ backgroundColor: value, borderColor: value }}
        >
          <span className="sr-only">Выбрать цвет</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-gray-800 border-gray-700">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <Button
              key={color.value}
              variant="outline"
              size="sm"
              className="w-12 h-12 p-0 border-2 relative"
              style={{ backgroundColor: color.value, borderColor: color.value }}
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
            >
              {value === color.value && (
                <Check className="w-4 h-4 text-white drop-shadow-lg" />
              )}
              <span className="sr-only">{color.name}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
