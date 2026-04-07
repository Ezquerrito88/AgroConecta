import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReviewService, ReviewPendiente, Review } from '../../core/services/review';
import { AuthService } from '../../core/services/auth';
import { environment } from '../../../environments/environment';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-valoraciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComprador],
  templateUrl: './valoraciones.html',
  styleUrls: ['./valoraciones.css']
})
export class Valoraciones implements OnInit {
  pendientes: ReviewPendiente[] = [];
  misReviews: Review[] = [];
  loading = true;
  activeTab: 'pendientes' | 'hechas' = 'pendientes';

  // Topbar
  userInitial = '';
  firstName = '';

  // Modal
  modalOpen = false;
  selectedProduct: ReviewPendiente | null = null;
  rating = 0;
  hoverRating = 0;
  comment = '';
  sending = false;
  errorMsg = '';

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U';
    this.firstName   = user?.name?.split(' ')[0] ?? '';
    this.cargarDatos();
  }

  cargarDatos(): void {
  this.loading = true;

  forkJoin({
    pendientes: this.reviewService.getPendientes(),
    reviews:    this.reviewService.getMisReviews()
  }).subscribe({
    next: ({ pendientes, reviews }) => {
      this.pendientes = pendientes;
      this.misReviews = reviews;
      this.loading    = false;
    },
    error: (err) => {
      console.error('❌ Error cargando valoraciones:', err);
      this.loading = false;
    }
  });
}

  abrirModal(item: ReviewPendiente): void {
    this.selectedProduct = item;
    this.rating      = 0;
    this.hoverRating = 0;
    this.comment     = '';
    this.errorMsg    = '';
    this.modalOpen   = true;
  }

  cerrarModal(): void {
    this.modalOpen      = false;
    this.selectedProduct = null;
  }

  setRating(r: number): void  { this.rating = r; }
  setHover(r: number): void   { this.hoverRating = r; }
  clearHover(): void          { this.hoverRating = 0; }
  activeRating(): number      { return this.hoverRating || this.rating; }

  enviarReview(): void {
    if (!this.rating || !this.selectedProduct || this.sending) return;

    this.sending  = true;
    this.errorMsg = '';

    this.reviewService.store({
      product_id: this.selectedProduct.product_id,
      rating:     this.rating,
      comment:    this.comment
    }).subscribe({
      next: (review) => {
        console.log('Review creada:', review);
        this.misReviews  = [review, ...this.misReviews];
        this.pendientes  = this.pendientes.filter(
          p => p.product_id !== this.selectedProduct!.product_id
        );
        this.sending = false;
        this.cerrarModal();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Error al enviar la valoración';
        this.sending  = false;
      }
    });
  }

  getImageUrl(product: any): string {
    const img = product?.images?.[0];
    if (!img) return 'assets/placeholder.png';
    if (img.image_url) return img.image_url;
    const path = img.image_path;
    if (path?.startsWith('http')) return path;
    return `${environment.storageUrl}/${path}`;
  }

  stars(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }
}