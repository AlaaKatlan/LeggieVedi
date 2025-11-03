// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // إعادة التوجيه لصفحة تسجيل الدخول
  router.navigate(['/admin/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
