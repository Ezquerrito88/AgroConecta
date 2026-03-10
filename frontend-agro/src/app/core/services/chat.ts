import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  attachment_url?: string;
  is_read: number;
  created_at: string;
  sender?: any;
}

export interface Conversation {
  id: number;
  buyer_id: number;
  farmer_id: number;
  buyer?: any;
  farmer?: any;
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.api}/conversations`);
  }

  startConversation(farmerId: number): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.api}/conversations`, { farmer_id: farmerId });
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.api}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.api}/conversations/${conversationId}/messages`, { content });
  }
}
