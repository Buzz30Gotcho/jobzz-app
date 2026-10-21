import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AiFreeMessageInput, GeneratedMessage } from '@jobzz/shared';

const API = '/api/ai';

/** Accès à la couche IA côté front (disponibilité, rédaction de messages d'envoi libre). */
@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  /** `null` = pas encore su ; mis en cache après le premier appel. */
  readonly available = signal<boolean | null>(null);

  async loadStatus(): Promise<boolean> {
    if (this.available() !== null) return this.available()!;
    try {
      const { available } = await firstValueFrom(this.http.get<{ available: boolean }>(`${API}/status`));
      this.available.set(available);
      return available;
    } catch {
      this.available.set(false);
      return false;
    }
  }

  freeMessage(input: AiFreeMessageInput): Promise<GeneratedMessage> {
    return firstValueFrom(this.http.post<GeneratedMessage>(`${API}/free-message`, input));
  }
}
