import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Notification, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  dismissNotification 
} from '@/lib/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationsPanelProps {
  unreadCount?: number;
  onCountChange?: (count: number) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
    default: return <Info className="h-4 w-4 text-info" />;
  }
};

const getNotificationStyle = (type: string, isRead: boolean) => {
  const baseStyle = isRead ? 'opacity-60' : '';
  switch (type) {
    case 'critical': return `${baseStyle} border-l-4 border-l-destructive bg-destructive/5`;
    case 'warning': return `${baseStyle} border-l-4 border-l-warning bg-warning/5`;
    case 'success': return `${baseStyle} border-l-4 border-l-success bg-success/5`;
    default: return `${baseStyle} border-l-4 border-l-info bg-info/5`;
  }
};

const getCategoryBadge = (category: string) => {
  const styles: Record<string, string> = {
    fiscal: 'bg-info/10 text-info border-info/30',
    epargne: 'bg-success/10 text-success border-success/30',
    immobilier: 'bg-warning/10 text-warning border-warning/30',
    professionnel: 'bg-accent/10 text-accent border-accent/30',
    general: 'bg-muted text-muted-foreground border-border'
  };
  const labels: Record<string, string> = {
    fiscal: 'Fiscal',
    epargne: 'Épargne',
    immobilier: 'Immo',
    professionnel: 'Pro',
    general: 'Général'
  };
  return { style: styles[category] || styles.general, label: labels[category] || category };
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDismiss 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) => {
  const categoryBadge = getCategoryBadge(notification.category);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-4 rounded-lg ${getNotificationStyle(notification.type, notification.is_read)} group`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{notification.title}</h4>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryBadge.style}`}>
              {categoryBadge.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationsPanel = ({ unreadCount: externalCount, onCountChange }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const criticalCount = notifications.filter(n => n.type === 'critical' && !n.is_read).length;

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    onCountChange?.(unreadCount);
  }, [unreadCount, onCountChange]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleDismiss = async (id: string) => {
    const success = await dismissNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {(externalCount || unreadCount) > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -right-1 h-5 w-5 text-[10px] font-bold rounded-full flex items-center justify-center ${
                criticalCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
              }`}
            >
              {externalCount || unreadCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucune notification</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Tu es à jour !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
