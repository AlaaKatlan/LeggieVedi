// src/app/core/services/auth.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service'; // استيراد الخدمة الموحدة

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'editor';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // حقن الخدمة الموحدة
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<AdminUser | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  constructor() {
    this.checkSession();
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // استخدام הـ client الموحد
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, role')
        .eq('email', email)
        .single();

      if (adminError) throw adminError;

      this.currentUser.set(adminData as AdminUser);
      this.isAuthenticated.set(true);
      localStorage.setItem('admin_user', JSON.stringify(adminData));

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'فشل تسجيل الدخول' };
    }
  }

  async logout(): Promise<void> {
    await this.supabaseService.getClient().auth.signOut();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('admin_user');
    this.router.navigate(['/admin/login']);
  }

  private async checkSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();

      if (session) {
        const savedUser = localStorage.getItem('admin_user');
        if (savedUser) {
          this.currentUser.set(JSON.parse(savedUser));
          this.isAuthenticated.set(true);
        }
      } else {
        // تنظيف اللوكال ستورج إذا انتهت صلاحية الجلسة في السيرفر
        localStorage.removeItem('admin_user');
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  hasRole(role: 'admin' | 'editor'): boolean {
    const user = this.currentUser();
    return user?.role === role || user?.role === 'admin';
  }
}
