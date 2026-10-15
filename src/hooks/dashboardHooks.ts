import { useQuery } from '@tanstack/react-query';
import { buscarDashboard } from '../api/dashboardApi';

/** A chave ['dashboard'] é invalidada pelas outras áreas sempre que gravam algo que aparece aqui. */
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: buscarDashboard });
}
