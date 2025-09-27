import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artwork-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 4rem; text-align: center;">
      <h2>Artwork Detail Page</h2>
      <p>Displaying details for artwork with ID: <strong>{{ id }}</strong></p>
      <p>You can build out this component later.</p>
    </div>
  `,
  styles: ``
})
export class ArtworkDetailComponent {
  @Input() id!: string;
}
