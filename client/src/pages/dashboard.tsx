import { MainLayout } from '@/components/layout/main-layout';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { ProjectsOverview } from '@/components/dashboard/projects-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { LGPDStatus } from '@/components/dashboard/lgpd-status';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Visão geral das atividades e métricas da sua organização
          </p>
        </div>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Projects Overview */}
          <div className="xl:col-span-2">
            <ProjectsOverview />
          </div>

          {/* Sidebar Content */}
          <div className="space-y-4 sm:space-y-6">
            <RecentActivity />
            <QuickActions />
            <LGPDStatus />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
