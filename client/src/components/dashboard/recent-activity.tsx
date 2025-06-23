import { DollarSign, UserPlus, FileText, Users, Globe, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ActivityLog {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  userName?: string;
  metadata?: any;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'project_created':
    case 'project_updated':
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
    case 'donation_received':
      return { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
    case 'volunteer_registered':
    case 'beneficiary_added':
      return { icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' };
    case 'user_created':
      return { icon: Users, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' };
    case 'site_updated':
      return { icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20' };
    case 'course_completed':
      return { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    case 'course_created':
      return { icon: BookOpen, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/20' };
    default:
      return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/20' };
  }
}

export function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            activities.map((activity: ActivityLog) => {
              const { icon: Icon, color, bg } = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(new Date(activity.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
