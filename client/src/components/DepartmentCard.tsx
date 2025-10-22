import { Card } from '@/components/ui/card';
import { departmentIcons } from '@shared/departmentIcons';
import ecoIconsImage from '@assets/4_1761121528548.png';

interface DepartmentCardProps {
  name: string;
  unreadCount: number;
  onClick: () => void;
}

// Координаты каждой иконки в спрайте (в процентах)
// Изображение содержит сетку 4x9 иконок
const iconPositions: Record<string, { x: number; y: number }> = {
  'building': { x: 0, y: 0 },        // Город в руках
  'folder-tree': { x: 25, y: 0 },    // Листья в круге
  'landmark': { x: 50, y: 0 },       // Зелёный город
  'cloud-rain': { x: 75, y: 0 },     // Шестерня с листьями
  'mountain': { x: 0, y: 11.11 },    // Зелёный город полукругом
  'mountain-snow': { x: 25, y: 11.11 }, // Корова на траве
  'clipboard-check': { x: 50, y: 11.11 }, // Город в круге
  'cog': { x: 75, y: 11.11 },        // Глобус зелёный
  'sprout': { x: 0, y: 22.22 },      // Рост (стрелка вверх)
  'leaf': { x: 25, y: 22.22 },       // Люди с деревом
  'activity': { x: 50, y: 22.22 },   // Яблоко
  'users': { x: 75, y: 22.22 },      // Листья в круге
  'wind': { x: 0, y: 33.33 },        // Дом
  'cpu': { x: 25, y: 33.33 },        // Зелёный лист
  'tree-pine': { x: 50, y: 33.33 },  // ECO дерево
  'calculator': { x: 75, y: 33.33 }, // Весы
  'globe': { x: 0, y: 44.44 },       // Рука останавливает
  'scale': { x: 25, y: 44.44 },      // Капля воды
  'land-plot': { x: 50, y: 44.44 },  // Переработка
  'droplet': { x: 75, y: 44.44 },    // Смайлик земля
  'shield': { x: 0, y: 55.56 },      // Круговая стрелка
  'trees': { x: 25, y: 55.56 },      // Дом с листом
  'microscope': { x: 50, y: 55.56 }, // Капля с листом
  'waves': { x: 75, y: 55.56 },      // Рука с листом
  'recycle': { x: 0, y: 66.67 },     // Листья крестиком
  'flask-conical': { x: 25, y: 66.67 }, // Переработка символ
  'monitor': { x: 50, y: 66.67 },    // Термометр
  'clipboard-list': { x: 75, y: 66.67 }, // Руки с листьями
  'ruler': { x: 0, y: 77.78 },       // Шестерёнки
  'dna': { x: 25, y: 77.78 },        // Земля с каплей
  'sun': { x: 50, y: 77.78 },        // Книга контактов
  'trending-up': { x: 75, y: 77.78 }, // Переработка треугольник
  'wrench': { x: 0, y: 88.89 },      // Лампочка экономная
  'newspaper': { x: 25, y: 88.89 },  // Листик
  'book-open': { x: 50, y: 88.89 },  // Человек с листом
  'factory': { x: 75, y: 88.89 },    // Земля с деревом
  'binoculars': { x: 0, y: 0 },      
  'building-2': { x: 0, y: 0 },      
};

export default function DepartmentCard({ name, unreadCount, onClick }: DepartmentCardProps) {
  const iconName = departmentIcons[name] || 'building-2';
  const position = iconPositions[iconName] || { x: 0, y: 0 };
  
  return (
    <Card
      className="relative cursor-pointer p-6 hover-elevate active-elevate-2 transition-colors"
      onClick={onClick}
      data-testid={`card-department-${name}`}
    >
      <div className="flex items-center gap-3">
        <div 
          className="h-12 w-12 shrink-0 bg-no-repeat bg-center rounded-full overflow-hidden"
          style={{
            backgroundImage: `url(${ecoIconsImage})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: '400%',
          }}
        />
        <h3 className="text-base font-medium text-foreground flex-1">{name}</h3>
        {unreadCount > 0 && (
          <div 
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0"
            data-testid={`badge-unread-${name}`}
          >
            {unreadCount}
          </div>
        )}
      </div>
    </Card>
  );
}
