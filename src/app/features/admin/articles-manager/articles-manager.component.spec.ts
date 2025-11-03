import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticlesManagerComponent } from './articles-manager.component';

describe('ArticlesManagerComponent', () => {
  let component: ArticlesManagerComponent;
  let fixture: ComponentFixture<ArticlesManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticlesManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticlesManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
