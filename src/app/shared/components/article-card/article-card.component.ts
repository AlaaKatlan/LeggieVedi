import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Article } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss']
})
export class ArticleCardComponent {
  // هذا المتغير سيستقبل بيانات المقال من الخارج
  @Input({ required: true }) article!: Article;
}
