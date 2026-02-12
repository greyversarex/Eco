import { useRoute } from 'wouter';
import AssignmentsPage from './AssignmentsPage';

export default function MonitoringAssignments() {
  const [, params] = useRoute('/department/monitoring/assignments/:id');
  const departmentId = params?.id ? parseInt(params.id) : undefined;

  return <AssignmentsPage monitoringDepartmentId={departmentId} />;
}
