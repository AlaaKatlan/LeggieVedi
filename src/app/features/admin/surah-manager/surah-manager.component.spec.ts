import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurahManagerComponent } from './surah-manager.component';

describe('SurahManagerComponent', () => {
  let component: SurahManagerComponent;
  let fixture: ComponentFixture<SurahManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurahManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurahManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
