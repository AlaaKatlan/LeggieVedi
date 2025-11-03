// src/app/core/services/auth.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'editor';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);

  // Signals للحالة
  currentUser = signal<AdminUser | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    // فحص الجلسة عند بدء التطبيق
    this.checkSession();
  }

  /**
   * تسجيل الدخول
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // استخدام Supabase Auth
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // جلب معلومات المستخدم من جدول admin_users
      const { data: adminData, error: adminError } = await this.supabase
        .from('admin_users')
        .select('id, email, role')
        .eq('email', email)
        .single();

      if (adminError) throw adminError;

      this.currentUser.set(adminData);
      this.isAuthenticated.set(true);

      // حفظ في LocalStorage
      localStorage.setItem('admin_user', JSON.stringify(adminData));

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'فشل تسجيل الدخول'
      };
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('admin_user');
    this.router.navigate(['/admin/login']);
  }

  /**
   * فحص الجلسة الحالية
   */
  private async checkSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      if (session) {
        const savedUser = localStorage.getItem('admin_user');
        if (savedUser) {
          this.currentUser.set(JSON.parse(savedUser));
          this.isAuthenticated.set(true);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * فحص الصلاحيات
   */
  hasRole(role: 'admin' | 'editor'): boolean {
    const user = this.currentUser();
    return user?.role === role || user?.role === 'admin';
  }
}
