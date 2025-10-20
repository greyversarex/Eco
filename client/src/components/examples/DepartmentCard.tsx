import DepartmentCard from '../DepartmentCard';

export default function DepartmentCardExample() {
  return (
    <div className="p-4 space-y-4 max-w-md">
      <DepartmentCard 
        name="Раёсати Душанбе" 
        unreadCount={3} 
        onClick={() => console.log('Department clicked')} 
      />
      <DepartmentCard 
        name="Агентии обухаводонимоси" 
        unreadCount={0} 
        onClick={() => console.log('Department clicked')} 
      />
    </div>
  );
}
