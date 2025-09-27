import {
  trigger,
  transition,
  style,
  query,
  group,
  animate,
  animateChild,
} from '@angular/animations';

// تعريف الأنيميشن
export const routeTransitionAnimations = trigger('routeAnimations', [
  // تحديد الانتقال بين أي صفحتين ('* <=> *')
  transition('* <=> *', [
    // إعدادات أولية للصفحتين (الداخلة والخارجة)
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      })
    ], { optional: true }),

    // إعداد الصفحة الجديدة (الداخلة) لتكون شفافة ومزاحة للأسفل قليلاً
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' })
    ], { optional: true }),

    // تشغيل الأنيميشن الخاص بالصفحة القديمة (الخارجة)
    query(':leave', animateChild(), { optional: true }),

    // تنفيذ الأنيميشن للصفحتين معًا
    group([
      // أنيميشن الخروج: تلاشي للأعلى
      query(':leave', [
        animate('400ms ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ], { optional: true }),
      // أنيميشن الدخول: تلاشي من الأسفل
      query(':enter', [
        animate('400ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true })
    ]),

    // تشغيل الأنيميشن الخاص بالصفحة الجديدة (الداخلة)
    query(':enter', animateChild(), { optional: true }),
  ])
]);
