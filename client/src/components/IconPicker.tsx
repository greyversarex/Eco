import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Building, FolderTree, Landmark, CloudRain, Mountain, MountainSnow,
  ClipboardCheck, Cog, Sprout, Leaf, Activity, Users, Wind, Cpu,
  TreePine, Calculator, Globe, Scale, LandPlot, Droplet, Shield,
  Trees, Microscope, Waves, Recycle, FlaskConical, Monitor,
  ClipboardList, Ruler, Dna, Sun, TrendingUp, Wrench, Newspaper,
  BookOpen, Factory, Binoculars, Building2, ChevronDown
} from 'lucide-react';

// Полный список доступных иконок
export const availableIcons: { name: string; label: string; Icon: any }[] = [
  { name: 'building', label: 'Здание', Icon: Building },
  { name: 'building-2', label: 'Здание 2', Icon: Building2 },
  { name: 'folder-tree', label: 'Папки', Icon: FolderTree },
  { name: 'landmark', label: 'Памятник', Icon: Landmark },
  { name: 'cloud-rain', label: 'Дождь', Icon: CloudRain },
  { name: 'mountain', label: 'Гора', Icon: Mountain },
  { name: 'mountain-snow', label: 'Снежная гора', Icon: MountainSnow },
  { name: 'clipboard-check', label: 'Буфер обмена', Icon: ClipboardCheck },
  { name: 'cog', label: 'Настройки', Icon: Cog },
  { name: 'sprout', label: 'Росток', Icon: Sprout },
  { name: 'leaf', label: 'Лист', Icon: Leaf },
  { name: 'activity', label: 'Активность', Icon: Activity },
  { name: 'users', label: 'Люди', Icon: Users },
  { name: 'wind', label: 'Ветер', Icon: Wind },
  { name: 'cpu', label: 'Процессор', Icon: Cpu },
  { name: 'tree-pine', label: 'Ель', Icon: TreePine },
  { name: 'calculator', label: 'Калькулятор', Icon: Calculator },
  { name: 'globe', label: 'Глобус', Icon: Globe },
  { name: 'scale', label: 'Весы', Icon: Scale },
  { name: 'land-plot', label: 'Земля', Icon: LandPlot },
  { name: 'droplet', label: 'Капля', Icon: Droplet },
  { name: 'shield', label: 'Щит', Icon: Shield },
  { name: 'trees', label: 'Деревья', Icon: Trees },
  { name: 'microscope', label: 'Микроскоп', Icon: Microscope },
  { name: 'waves', label: 'Волны', Icon: Waves },
  { name: 'recycle', label: 'Переработка', Icon: Recycle },
  { name: 'flask-conical', label: 'Колба', Icon: FlaskConical },
  { name: 'monitor', label: 'Монитор', Icon: Monitor },
  { name: 'clipboard-list', label: 'Список', Icon: ClipboardList },
  { name: 'ruler', label: 'Линейка', Icon: Ruler },
  { name: 'dna', label: 'ДНК', Icon: Dna },
  { name: 'sun', label: 'Солнце', Icon: Sun },
  { name: 'trending-up', label: 'Рост', Icon: TrendingUp },
  { name: 'wrench', label: 'Ключ', Icon: Wrench },
  { name: 'newspaper', label: 'Газета', Icon: Newspaper },
  { name: 'book-open', label: 'Книга', Icon: BookOpen },
  { name: 'factory', label: 'Фабрика', Icon: Factory },
  { name: 'binoculars', label: 'Бинокль', Icon: Binoculars },
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const selectedIcon = availableIcons.find(i => i.name === value) || availableIcons.find(i => i.name === 'building-2')!;
  const filteredIcons = availableIcons.filter(icon =>
    icon.label.toLowerCase().includes(search.toLowerCase()) ||
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid="button-icon-picker"
        >
          <div className="flex items-center gap-2">
            <selectedIcon.Icon className="h-4 w-4" />
            <span>{selectedIcon.label}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="p-2 border-b">
          <Input
            placeholder="Поиск иконки..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-icon-search"
          />
        </div>
        <div className="grid grid-cols-4 gap-2 p-2 max-h-[300px] overflow-y-auto">
          {filteredIcons.map((icon) => (
            <Button
              key={icon.name}
              variant={value === icon.name ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => {
                onChange(icon.name);
                setOpen(false);
              }}
              data-testid={`button-icon-${icon.name}`}
            >
              <icon.Icon className="h-5 w-5" />
              <span className="text-xs">{icon.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
