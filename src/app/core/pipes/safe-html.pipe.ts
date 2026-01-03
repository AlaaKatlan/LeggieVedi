import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true // ضروري جداً لأنك تستخدم Standalone Components
})
export class SafeHtmlPipe implements PipeTransform {
  // حقن خدمة التعقيم الخاصة بـ Angular
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    // هذه الدالة تخبر أنجولار: "ثق بهذا الكود ولا تحذف الـ Styles منه"
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
