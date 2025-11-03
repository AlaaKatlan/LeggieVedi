import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationsManagerComponent } from './publications-manager.component';

describe('PublicationsManagerComponent', () => {
  let component: PublicationsManagerComponent;
  let fixture: ComponentFixture<PublicationsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
