
import { useState } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';
import { useLocation } from 'wouter';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  userName?: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'project_created':
    case 'project_updated':
      return '📋';
    case 'donation_received':
      return '💰';
    case 'volunteer_registered':
    case 'beneficiary_added':
      return '👥';
    case 'user_created':
      return '🆕';
    case 'site_updated':
      return '🌐';
    case 'course_completed':
      return '🏆';
    case 'course_created':
      return '📚';
    default:
      return '📝';
  }
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Safe access to notifications array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear all notifications');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicking
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type and metadata
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
      return;
    }

    // Generate navigation based on notification type
    switch (notification.type) {
      case 'beneficiary_created':
        if (notification.metadata?.beneficiaryId) {
          navigate('/beneficiaries');
        }
        break;
      case 'course_enrollment':
        if (notification.metadata?.courseId) {
          navigate(`/courses/${notification.metadata.courseId}/start`);
        }
        break;
      case 'project_assignment':
        if (notification.metadata?.projectId) {
          navigate(`/projects/${notification.metadata.projectId}`);
        }
        break;
      default:
        // Default to dashboard
        navigate('/dashboard');
        break;
    }
    setIsOpen(false);
  };

  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : safeNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-1">
              {safeNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(notification.createdAt))}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {safeNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
