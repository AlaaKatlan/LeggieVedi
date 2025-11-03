// src/app/features/admin/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <h1>🔐 Admin Panel</h1>
          <p>لوحة التحكم - Nabil Al-Mahaini</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          @if (errorMessage()) {
            <div class="error-alert">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage() }}
            </div>
          }

          <div class="form-group">
            <label for="email">
              <i class="fas fa-envelope"></i>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="admin@example.com"
              [disabled]="isLoading()"
            />
          </div>

          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              [disabled]="isLoading()"
            />
          </div>

          <button
            type="submit"
            class="login-btn"
            [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              جاري تسجيل الدخول...
            } @else {
              <i class="fas fa-sign-in-alt"></i>
              تسجيل الدخول
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #01579b 0%, #00897b 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 3rem;
      max-width: 450px;
      width: 100%;
      animation: slideUp 0.5s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo-section {
      text-align: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        margin: 0 0 0.5rem 0;
        color: #01579b;
      }

      p {
        color: #64748b;
        margin: 0;
      }
    }

    .error-alert {
      background: #fee;
      color: #c00;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
      }

      input {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #01579b;
          box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
        }

        &:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
      }
    }

    .login-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(1, 87, 155, 0.3);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.login(this.email, this.password);

    if (result.success) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
      this.router.navigate([returnUrl]);
    } else {
      this.errorMessage.set(result.error || 'فشل تسجيل الدخول');
    }

    this.isLoading.set(false);
  }
}
