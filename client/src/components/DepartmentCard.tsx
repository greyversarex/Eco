import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, FolderTree, Landmark, CloudRain, Mountain, MountainSnow, 
  ClipboardCheck, Cog, Sprout, Leaf, Activity, Users, Wind, Cpu, 
  TreePine, Calculator, Globe, Scale, LandPlot, Droplet, Shield, 
  Trees, Microscope, Waves, Recycle, FlaskConical, Monitor, 
  ClipboardList, Ruler, Dna, Sun, TrendingUp, Wrench, Newspaper, 
  BookOpen, Factory, Binoculars, Building2 
} from 'lucide-react';
import { departmentIcons } from '@shared/departmentIcons';

interface DepartmentCardProps {
  name: string;
  unreadCount: number;
  onClick: () => void;
}

const iconMap: Record<string, any> = {
  'building': Building,
  'folder-tree': FolderTree,
  'landmark': Landmark,
  'cloud-rain': CloudRain,
  'mountain': Mountain,
  'mountain-snow': MountainSnow,
  'clipboard-check': ClipboardCheck,
  'cog': Cog,
  'sprout': Sprout,
  'leaf': Leaf,
  'activity': Activity,
  'users': Users,
  'wind': Wind,
  'cpu': Cpu,
  'tree-pine': TreePine,
  'calculator': Calculator,
  'globe': Globe,
  'scale': Scale,
  'land-plot': LandPlot,
  'droplet': Droplet,
  'shield': Shield,
  'trees': Trees,
  'microscope': Microscope,
  'waves': Waves,
  'recycle': Recycle,
  'flask-conical': FlaskConical,
  'monitor': Monitor,
  'clipboard-list': ClipboardList,
  'ruler': Ruler,
  'dna': Dna,
  'sun': Sun,
  'trending-up': TrendingUp,
  'wrench': Wrench,
  'newspaper': Newspaper,
  'book-open': BookOpen,
  'factory': Factory,
  'binoculars': Binoculars,
  'building-2': Building2,
};

export default function DepartmentCard({ name, unreadCount, onClick }: DepartmentCardProps) {
  const iconName = departmentIcons[name] || 'building-2';
  const IconComponent = iconMap[iconName] || Building2;
  
  const words = name.split(' ');
  const firstWord = words[0];
  const restOfWords = words.slice(1).join(' ');
  
  return (
    <Card
      className="relative cursor-pointer p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:bg-primary/5"
      onClick={onClick}
      data-testid={`card-department-${name}`}
    >
      {unreadCount > 0 && (
        <div 
          className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold shadow-md"
          data-testid={`badge-unread-${name}`}
        >
          {unreadCount}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 mt-0.5">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-foreground leading-snug">
            {firstWord}
            {restOfWords && (
              <>
                <br />
                {restOfWords}
              </>
            )}
          </h3>
        </div>
      </div>
    </Card>
  );
}
