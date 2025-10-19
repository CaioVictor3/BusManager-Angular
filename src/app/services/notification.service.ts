import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../models/notification.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  showToast(message: string, type: NotificationType = 'info', duration?: number): void {
    const notification: Notification = {
      id: 'toast-' + Date.now(),
      message,
      type,
      duration: duration || APP_CONFIG.NOTIFICATION.defaultDuration,
      timestamp: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto remove notification after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }
}
