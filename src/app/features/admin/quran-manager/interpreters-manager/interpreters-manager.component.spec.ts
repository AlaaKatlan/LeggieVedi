import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterpretersManagerComponent } from './interpreters-manager.component';

describe('InterpretersManagerComponent', () => {
  let component: InterpretersManagerComponent;
  let fixture: ComponentFixture<InterpretersManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterpretersManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterpretersManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
