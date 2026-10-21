import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  renderMessage,
  type FollowUpKind,
  type PublicApplication,
} from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { buildMessageVars } from '../../../core/applications/message-vars';
import { ModalComponent } from '../../../shared/modal.component';
import { MessageComposerComponent, type ComposedMessage } from '../../../shared/message-composer.component';

/**
 * Dialogue « Buzzer » (relance). Avec email : compositeur Gmail/Outlook/messagerie + confirmation.
 * Sans email : message LinkedIn court à copier (CLAUDE.md §4.3, « Sans email : l'autre canal »).
 */
@Component({
  selector: 'jz-buzz-dialog',
  standalone: true,
  imports: [LucideAngularModule, ModalComponent, MessageComposerComponent],
  template: `
    <jz-modal [title]="'Buzzer ' + application().companyName" (closed)="closed.emit()">
      <p class="mb-4 text-sm text-text-secondary">
        {{ application().position }} · candidature du {{ appliedAtLabel() }}
      </p>

      @if (hasEmail()) {
        <jz-message-composer
          [initialTo]="application().contactEmail ?? ''"
          [initialSubject]="subject()"
          [initialBody]="body()"
          [saving]="saving()"
          (sent)="onSent($event)"
          (cancelled)="closed.emit()"
        />
      } @else {
        <div class="space-y-4">
          <p class="text-sm text-text-secondary">
            Pas d'email pour cette candidature. Voici un message court à envoyer sur LinkedIn (cherche
            la personne toi-même) :
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

  readonly application = input.required<PublicApplication>();
  readonly done = output<PublicApplication>();
  readonly closed = output<void>();

  readonly subject = signal('');
  readonly body = signal('');
  readonly saving = signal(false);
  readonly copied = signal(false);

  hasEmail(): boolean {
    return !!this.application().contactEmail;
  }

  appliedAtLabel(): string {
    return new Date(this.application().appliedAt).toLocaleDateString('fr-FR');
  }

  async ngOnInit(): Promise<void> {
    const profile = await this.profileService.load().catch(() => null);
    const vars = buildMessageVars(this.application(), profile);
    const message = renderMessage(this.kind(), vars);
    this.subject.set(message.subject);
    this.body.set(message.body);
  }

  /** Première relance = « relance » ; LinkedIn sans email ; relance suivante = « relance_encore ». */
  private kind(): FollowUpKind {
    if (!this.hasEmail()) return 'linkedin';
    return this.application().followUpCount > 0 ? 'relance_encore' : 'relance';
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
        aiGenerated: false,
      });
      this.done.emit(updated);
    } finally {
      this.saving.set(false);
    }
  }
}
