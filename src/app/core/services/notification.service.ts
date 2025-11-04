// notification.service.ts
import { Injectable, signal } from '@angular/core';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private nextId = 0;

  show(message: string, type: Notification['type'] = 'info', duration = 3000) {
    const id = this.nextId++;
    this.notifications.update(n => [...n, { id, message, type }]);

    setTimeout(() => {
      this.notifications.update(n => n.filter(item => item.id !== id));
    }, duration);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }
}
