import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface ConfirmationData {
  orderIds: number[];
  total: number;
  totalItems: number;
  paymentMethod: string;
  discountCode?: string;
  discountPct?: number;
  createdAt: string;
}

@Component({
  selector: 'app-checkout-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, CurrencyPipe],
  templateUrl: './checkout-confirmation.html',
  styleUrls: ['./checkout-confirmation.css']
})
export class CheckoutConfirmation implements OnInit {
  private readonly LAST_ORDER_CONFIRMATION_KEY = 'last_order_confirmation';

  data: ConfirmationData | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const raw = localStorage.getItem(this.LAST_ORDER_CONFIRMATION_KEY);

    if (!raw) {
      this.router.navigate(['/']);
      return;
    }

    try {
      this.data = JSON.parse(raw) as ConfirmationData;
    } catch {
      this.router.navigate(['/']);
      return;
    }
  }

  finish(): void {
    localStorage.removeItem(this.LAST_ORDER_CONFIRMATION_KEY);
    this.router.navigate(['/']);
  }
}
