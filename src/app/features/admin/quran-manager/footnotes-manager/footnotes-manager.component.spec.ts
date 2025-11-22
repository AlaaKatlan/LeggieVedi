import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FootnotesManagerComponent } from './footnotes-manager.component';

describe('FootnotesManagerComponent', () => {
  let component: FootnotesManagerComponent;
  let fixture: ComponentFixture<FootnotesManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FootnotesManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FootnotesManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
