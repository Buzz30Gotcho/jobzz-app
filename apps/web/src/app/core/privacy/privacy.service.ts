import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const API = '/api/privacy';

/** « Mes données » (CLAUDE.md §4.12) : export (ZIP) et suppression du compte. */
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly http = inject(HttpClient);

  /** Télécharge le ZIP de toutes les données et déclenche l'enregistrement du fichier. */
  async exportData(): Promise<void> {
    const blob = await firstValueFrom(
      this.http.get(`${API}/export`, { responseType: 'blob' }),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jobzz-mes-donnees.zip';
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Suppression définitive : l'email retapé doit correspondre exactement au compte. */
  deleteAccount(confirmEmail: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${API}/delete-account`, { confirmEmail }),
    );
  }
}
