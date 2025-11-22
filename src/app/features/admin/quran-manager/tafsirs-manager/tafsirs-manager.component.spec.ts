import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TafsirsManagerComponent } from './tafsirs-manager.component';

describe('TafsirsManagerComponent', () => {
  let component: TafsirsManagerComponent;
  let fixture: ComponentFixture<TafsirsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TafsirsManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TafsirsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
