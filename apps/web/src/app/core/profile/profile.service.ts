import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ProfileUpdateInput, PublicProfile } from '@jobzz/shared';

const API = '/api/profile';

/** Accès au profil de l'utilisateur, avec un cache simple en signal (CLAUDE.md §7). */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly _profile = signal<PublicProfile | null>(null);
  readonly profile = this._profile.asReadonly();

  /** Charge le profil (depuis le cache si déjà présent, sauf `force`). */
  async load(force = false): Promise<PublicProfile> {
    const cached = this._profile();
    if (cached && !force) return cached;
    const profile = await firstValueFrom(this.http.get<PublicProfile>(API));
    this._profile.set(profile);
    return profile;
  }

  async save(input: ProfileUpdateInput): Promise<PublicProfile> {
    const profile = await firstValueFrom(this.http.put<PublicProfile>(API, input));
    this._profile.set(profile);
    return profile;
  }
}
