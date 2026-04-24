import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService, Conversation, Message } from '../../core/services/chat';
import { AuthService } from '../../core/services/auth';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  newMessage = '';
  currentUserId = 0;
  loading = false;
  sendingMessage = false;

  pendingProduct: {
    id: number;
    name: string;
    image: string;
    price: string;
    unit: string;
  } | null = null;

  private pollSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id ?? 0;
    this.loading = true;

    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = Array.isArray(data) ? data : (data as any).data ?? [];
        this.loading = false;
        Promise.resolve().then(() => {
          this.handleQueryParams();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error cargando conversaciones:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleQueryParams(): void {
    const p = this.route.snapshot.queryParams;
    if (!p['farmerId']) return;

    const farmerId = Number(p['farmerId']);

    if (p['productId']) {
      this.pendingProduct = {
        id:    Number(p['productId']),
        name:  p['productName'],
        image: p['productImage'],
        price: p['productPrice'],
        unit:  p['productUnit']
      };
    }

    // Limpia la URL sin recargar
    window.history.replaceState({}, '', window.location.pathname);

    const existing = this.conversations.find(c => c.farmer_id === farmerId);

    if (existing) {
      setTimeout(() => this.selectConversation(existing), 50);
    } else {
      this.chatService.startConversation(farmerId).subscribe({
        next: (conv) => {
          this.conversations = [conv, ...this.conversations];
          this.selectedConversation = conv;
          this.messages = [];
          this.stopPolling();
          this.startPolling(conv.id);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al crear conversación:', err)
      });
    }
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.stopPolling();
    this.loadMessages(conv.id);
    this.startPolling(conv.id);
  }

  goBack(): void {
    this.selectedConversation = null;
    this.stopPolling();
  }

  loadMessages(convId: number): void {
    this.chatService.getMessages(convId).subscribe({
      next: (data) => {
        this.messages = data;
        Promise.resolve().then(() => this.cdr.detectChanges());
      },
      error: (err) => console.error('Error cargando mensajes:', err)
    });
  }

  startPolling(convId: number): void {
    this.pollSub = interval(5000)
      .pipe(switchMap(() => this.chatService.getMessages(convId)))
      .subscribe({
        next: (data) => {
          if (data.length !== this.messages.length) {
            this.messages = data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error en polling:', err)
      });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sendingMessage) return;

    const userText = this.newMessage.trim();
    this.newMessage = '';
    this.sendingMessage = true;

    if (this.pendingProduct) {
      const productMsg = `🌱 Te escribo por el producto: *${this.pendingProduct.name}* — ${this.pendingProduct.price}€/${this.pendingProduct.unit}\n${this.pendingProduct.image}`;

      this.chatService.sendMessage(this.selectedConversation.id, productMsg).subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.pendingProduct = null;
          this.cdr.detectChanges();

          this.chatService.sendMessage(this.selectedConversation!.id, userText).subscribe({
            next: (msg2) => {
              this.messages = [...this.messages, msg2];
              this.sendingMessage = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al enviar mensaje:', err);
              this.newMessage = userText;
              this.sendingMessage = false;
            }
          });
        },
        error: (err) => {
          console.error('Error al enviar tarjeta producto:', err);
          this.newMessage = userText;
          this.sendingMessage = false;
        }
      });

    } else {
      this.chatService.sendMessage(this.selectedConversation.id, userText).subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.sendingMessage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al enviar mensaje:', err);
          this.newMessage = userText;
          this.sendingMessage = false;
        }
      });
    }
  }

  isOwn(msg: Message): boolean {
    return msg.sender_id === this.currentUserId;
  }

  getContactName(conv: Conversation): string {
    return conv.buyer_id === this.currentUserId
      ? conv.farmer?.name ?? 'Agricultor'
      : conv.buyer?.name ?? 'Comprador';
  }

  getContactInitial(conv: Conversation): string {
    return this.getContactName(conv).charAt(0).toUpperCase();
  }

  getLastMessagePreview(conv: Conversation): string {
    const content = conv.last_message?.content ?? '';
    if (!content) return 'Sin mensajes';
    if (this.isProductMessage({ content } as Message)) {
      return '📦 ' + this.extractProductName(content);
    }
    return content;
  }

  showDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(this.messages[index - 1].created_at);
    const curr = new Date(this.messages[index].created_at);
    return prev.toDateString() !== curr.toDateString();
  }

  formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  isProductMessage(msg: Message): boolean {
    return msg.content.startsWith('🌱 Te escribo por el producto:');
  }

  extractProductName(content: string): string {
    const match = content.match(/\*(.+?)\*/);
    return match ? match[1] : '';
  }

  extractProductPrice(content: string): string {
    const match = content.match(/— (.+?)\n/);
    return match ? match[1] : '';
  }

  extractProductImage(content: string): string {
    const lines = content.split('\n');
    return lines[1]?.trim() ?? 'assets/placeholder.png';
  }

  extractProductText(content: string): string {
    const lines = content.split('\n');
    return lines[2]?.trim() ?? '';
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}