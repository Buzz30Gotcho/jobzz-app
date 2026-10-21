import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { renderMessage, type FollowUpKind, type PublicApplication } from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { AiService } from '../../../core/ai/ai.service';
import { buildMessageVars } from '../../../core/applications/message-vars';
import { ModalComponent } from '../../../shared/modal.component';
import { MessageComposerComponent, type ComposedMessage } from '../../../shared/message-composer.component';

/**
 * Dialogue « Buzzer » (relance). Avec email : compositeur Gmail/Outlook/messagerie + confirmation.
 * Sans email : message LinkedIn court à copier. Bouton « Rédiger avec l'IA » (Premium) si dispo.
 */
@Component({
  selector: 'jz-buzz-dialog',
  standalone: true,
  imports: [LucideAngularModule, ModalComponent, MessageComposerComponent],
  template: `
    <jz-modal [title]="'Buzzer ' + application().companyName" (closed)="closed.emit()">
      <div class="mb-4 flex items-center justify-between gap-2">
        <p class="text-sm text-text-secondary">{{ application().position }} · candidature du {{ appliedAtLabel() }}</p>
        @if (aiAvailable()) {
          <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" [disabled]="aiLoading()" (click)="writeWithAi()">
            <lucide-icon name="sparkles" [size]="14" /> {{ aiLoading() ? '…' : "Rédiger avec l'IA" }}
          </button>
        }
      </div>

      @if (aiGenerated()) {
        <p class="mb-3 flex items-center gap-1 text-xs text-accent">
          <lucide-icon name="sparkles" [size]="13" /> Rédigé par l'IA — relis avant d'envoyer
        </p>
      }

      @if (hasEmail()) {
        <jz-message-composer
          [to]="application().contactEmail ?? ''"
          [(subject)]="subject"
          [(body)]="body"
          [saving]="saving()"
          (sent)="onSent($event)"
          (cancelled)="closed.emit()"
        />
      } @else {
        <div class="space-y-4">
          <p class="text-sm text-text-secondary">
            Pas d'email pour cette candidature. Voici un message court à envoyer sur LinkedIn (cherche la personne toi-même) :
          </p>
          <textarea rows="5" class="jz-input resize-y" [value]="body()" readonly></textarea>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="jz-btn-ghost" (click)="copyLinkedin()">
              <lucide-icon name="copy" [size]="16" /> {{ copied() ? 'Copié' : 'Copier' }}
            </button>
            <button type="button" class="jz-btn-primary" [disabled]="saving()" (click)="markLinkedin()">
              Marquer comme relancé
            </button>
          </div>
        </div>
      }
    </jz-modal>
  `,
})
export class BuzzDialogComponent implements OnInit {
  private readonly applications = inject(ApplicationsService);
  private readonly profileService = inject(ProfileService);
  private readonly ai = inject(AiService);

  readonly application = input.required<PublicApplication>();
  readonly done = output<PublicApplication>();
  readonly closed = output<void>();

  readonly subject = signal('');
  readonly body = signal('');
  readonly saving = signal(false);
  readonly copied = signal(false);
  readonly aiAvailable = signal(false);
  readonly aiLoading = signal(false);
  readonly aiGenerated = signal(false);

  hasEmail(): boolean {
    return !!this.application().contactEmail;
  }

  appliedAtLabel(): string {
    return new Date(this.application().appliedAt).toLocaleDateString('fr-FR');
  }

  async ngOnInit(): Promise<void> {
    const profile = await this.profileService.load().catch(() => null);
    const message = renderMessage(this.kind(), buildMessageVars(this.application(), profile));
    this.subject.set(message.subject);
    this.body.set(message.body);
    this.aiAvailable.set(await this.ai.loadStatus());
  }

  /** Première relance = « relance » ; LinkedIn sans email ; relance suivante = « relance_encore ». */
  private kind(): FollowUpKind {
    if (!this.hasEmail()) return 'linkedin';
    return this.application().followUpCount > 0 ? 'relance_encore' : 'relance';
  }

  async writeWithAi(): Promise<void> {
    if (this.aiLoading()) return;
    this.aiLoading.set(true);
    try {
      const message = await this.applications.aiMessage(this.application().id);
      this.subject.set(message.subject);
      this.body.set(message.body);
      this.aiGenerated.set(message.aiGenerated);
    } catch {
      // IA indisponible ou non autorisée : on garde le modèle déjà affiché.
    } finally {
      this.aiLoading.set(false);
    }
  }

  async onSent(message: ComposedMessage): Promise<void> {
    await this.record(message.channel, message.subject, message.body);
  }

  async copyLinkedin(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.body());
    } catch {
      /* presse-papiers indisponible */
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  async markLinkedin(): Promise<void> {
    await this.record('linkedin', '', this.body());
  }

  private async record(channel: ComposedMessage['channel'], subject: string, body: string): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const updated = await this.applications.recordFollowUp(this.application().id, {
        kind: this.kind(),
        channel,
        subject: subject || undefined,
        body,
        aiGenerated: this.aiGenerated(),
      });
      this.done.emit(updated);
    } finally {
      this.saving.set(false);
    }
  }
}
