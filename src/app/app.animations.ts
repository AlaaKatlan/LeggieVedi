import { trigger, transition, style, query, animateChild, group, animate } from '@angular/animations';

export const routeTransitionAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [style({ opacity: 0, transform: 'translateY(20px)' })], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [animate('400ms ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))], { optional: true }),
      query(':enter', [animate('400ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true }),
  ])
]);
