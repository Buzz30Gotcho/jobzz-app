import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { renderMessage, type FreeSendType } from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { buildSignature } from '../../../core/applications/message-vars';
import { ModalComponent } from '../../../shared/modal.component';
import { MessageComposerComponent, type ComposedMessage } from '../../../shared/message-composer.component';

/**
 * « Écrire à une entreprise » (CLAUDE.md §4.3) : candidature spontanée (crée la candidature) ou
 * remerciement après entretien. Deux étapes : on saisit l'entreprise, puis on prépare le message.
 */
@Component({
  selector: 'jz-free-send-dialog',
  standalone: true,
  imports: [FormsModule, ModalComponent, MessageComposerComponent],
  template: `
    <jz-modal title="Écrire à une entreprise" (closed)="closed.emit()">
      @if (!ready()) {
        <div class="space-y-4">
          <div class="flex gap-2">
            <button
              type="button"
              [class]="type() === 'spontanee' ? active : inactive"
              (click)="type.set('spontanee')"
            >
              Candidature spontanée
            </button>
            <button
              type="button"
              [class]="type() === 'remerciement' ? active : inactive"
              (click)="type.set('remerciement')"
            >
              Remerciement
            </button>
          </div>
          <div>
            <label class="jz-label" for="fs-company">Entreprise</label>
            <input id="fs-company" class="jz-input" [(ngModel)]="companyName" />
          </div>
          <div>
            <label class="jz-label" for="fs-email">Email</label>
            <input id="fs-email" type="email" class="jz-input" [(ngModel)]="contactEmail" />
          </div>
          <div>
            <label class="jz-label" for="fs-position">Poste <span class="text-text-muted">(facultatif)</span></label>
            <input id="fs-position" class="jz-input" [(ngModel)]="position" />
          </div>

          @if (error()) {
            <p class="jz-field-error">{{ error() }}</p>
          }
          <button type="button" class="jz-btn-primary w-full" (click)="prepare()">Préparer le message</button>
        </div>
      } @else {
        <jz-message-composer
          [initialTo]="contactEmail"
          [initialSubject]="subject()"
          [initialBody]="body()"
          [saving]="saving()"
          (sent)="onSent($event)"
          (cancelled)="ready.set(false)"
        />
      }
    </jz-modal>
  `,
})
export class FreeSendDialogComponent {
  private readonly applications = inject(ApplicationsService);
  private readonly profileService = inject(ProfileService);

  readonly done = output<void>();
  readonly closed = output<void>();

  readonly active = 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink';
  readonly inactive = 'rounded-full border border-border px-4 py-1.5 text-sm text-text-secondary hover:text-text';

  readonly type = signal<FreeSendType>('spontanee');
  companyName = '';
  contactEmail = '';
  position = '';

  readonly ready = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly subject = signal('');
  readonly body = signal('');

  async prepare(): Promise<void> {
    if (!this.companyName.trim() || !this.contactEmail.trim()) {
      this.error.set("Renseigne au moins l'entreprise et l'email.");
      return;
    }
    this.error.set(null);
    const profile = await this.profileService.load().catch(() => null);
    const message = renderMessage(this.type(), {
      entreprise: this.companyName,
      poste: this.position || 'le poste',
      prenom: profile?.firstName ?? '',
      signature: buildSignature(profile),
    });
    this.subject.set(message.subject);
    this.body.set(message.body);
    this.ready.set(true);
  }

  async onSent(message: ComposedMessage): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.applications.freeSend({
        type: this.type(),
        companyName: this.companyName,
        contactEmail: this.contactEmail,
        position: this.position || undefined,
        subject: message.subject,
        body: message.body,
        channel: message.channel,
      });
      this.done.emit();
    } catch {
      this.error.set('Envoi impossible (limite atteinte ?). Réessaie.');
      this.ready.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
