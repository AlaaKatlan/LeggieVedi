import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideosManagerComponent } from './videos-manager.component';

describe('VideosManagerComponent', () => {
  let component: VideosManagerComponent;
  let fixture: ComponentFixture<VideosManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideosManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideosManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
