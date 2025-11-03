import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtworksManagerComponent } from './artworks-manager.component';

describe('ArtworksManagerComponent', () => {
  let component: ArtworksManagerComponent;
  let fixture: ComponentFixture<ArtworksManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtworksManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtworksManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
