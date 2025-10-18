import { Component, inject, signal } from '@angular/core';
import { Publication } from '../../core/models/publication';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent {
private supabase = inject(SupabaseService);

  public publications = signal<Publication[]>([]);
  public loading = signal<boolean>(true);

  async ngOnInit() {
    try {
      const data = await this.supabase.getAllPublications();
      console.log("Publications data:", data);
      this.publications.set(data as Publication[]);
    } catch (error) {
      console.error("Failed to load publications", error);
    } finally {
      this.loading.set(false);
    }
  }
}
