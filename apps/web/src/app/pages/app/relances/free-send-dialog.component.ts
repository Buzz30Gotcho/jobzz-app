import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { renderMessage, type FreeSendType } from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { AiService } from '../../../core/ai/ai.service';
import { buildSignature } from '../../../core/applications/message-vars';
import { ModalComponent } from '../../../shared/modal.component';
import { MessageComposerComponent, type ComposedMessage } from '../../../shared/message-composer.component';

/**
 * « Écrire à une entreprise » (CLAUDE.md §4.3) : candidature spontanée (crée la candidature) ou
 * remerciement après entretien. Un seul écran : les infos de l'entreprise en haut, puis le message
 * complet (objet + corps + boutons d'envoi), tout de suite visible et modifiable.
 */
@Component({
  selector: 'jz-free-send-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ModalComponent, MessageComposerComponent],
  template: `
    <jz-modal title="Écrire à une entreprise" (closed)="closed.emit()">
      <div class="space-y-4">
        <div class="flex gap-2">
          <button type="button" [class]="type() === 'spontanee' ? active : inactive" (click)="setType('spontanee')">
            Candidature spontanée
          </button>
          <button type="button" [class]="type() === 'remerciement' ? active : inactive" (click)="setType('remerciement')">
            Remerciement
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="jz-label" for="fs-company">Entreprise</label>
            <input id="fs-company" class="jz-input" [ngModel]="companyName()" (ngModelChange)="onCompany($event)" />
          </div>
          <div>
            <label class="jz-label" for="fs-position">Poste <span class="text-text-muted">(facultatif)</span></label>
            <input id="fs-position" class="jz-input" [ngModel]="position()" (ngModelChange)="onPosition($event)" />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span class="text-sm font-medium">Ton message</span>
          <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" (click)="fillTemplate()">
            <lucide-icon name="refresh-cw" [size]="14" /> Modèle
          </button>
          @if (aiAvailable()) {
            <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" [disabled]="aiLoading()" (click)="writeWithAi()">
              <lucide-icon name="sparkles" [size]="14" /> {{ aiLoading() ? '…' : "Rédiger avec l'IA" }}
            </button>
          }
          @if (aiGenerated()) {
            <span class="flex items-center gap-1 text-xs text-accent"><lucide-icon name="sparkles" [size]="13" /> IA</span>
          }
        </div>

        @if (error()) {
          <p class="jz-field-error">{{ error() }}</p>
        }

        <jz-message-composer
          [(subject)]="subject"
          [(body)]="body"
          [saving]="saving()"
          (sent)="onSent($event)"
          (cancelled)="closed.emit()"
        />
      </div>
    </jz-modal>
  `,
})
export class FreeSendDialogComponent implements OnInit {
  private readonly applications = inject(ApplicationsService);
  private readonly profileService = inject(ProfileService);
  private readonly ai = inject(AiService);

  readonly done = output<void>();
  readonly closed = output<void>();

  readonly active = 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink';
  readonly inactive = 'rounded-full border border-border px-4 py-1.5 text-sm text-text-secondary hover:text-text';

  readonly type = signal<FreeSendType>('spontanee');
  readonly companyName = signal('');
  readonly position = signal('');
  readonly subject = signal('');
  readonly body = signal('');

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly aiAvailable = signal(false);
  readonly aiLoading = signal(false);
  readonly aiGenerated = signal(false);

  /** Dernier corps issu d'un modèle : sert à savoir si l'utilisateur a modifié le message. */
  private readonly lastTemplate = signal('');
  /** Le modèle n'écrase pas un message écrit à la main (sauf via le bouton « Modèle »). */
  private readonly bodyTouchedByUser = computed(
    () => this.body().length > 0 && this.body() !== this.lastTemplate(),
  );

  async ngOnInit(): Promise<void> {
    await this.fillTemplate(); // message visible d'emblée (modifiable)
    this.aiAvailable.set(await this.ai.loadStatus());
  }

  setType(type: FreeSendType): void {
    this.type.set(type);
    this.aiGenerated.set(false);
    if (!this.bodyTouchedByUser()) this.fillTemplate();
  }

  onCompany(value: string): void {
    this.companyName.set(value);
  }

  onPosition(value: string): void {
    this.position.set(value);
  }

  /** Remplit l'objet et le corps à partir d'un modèle (toujours modifiable ensuite). */
  async fillTemplate(): Promise<void> {
    const profile = await this.profileService.load().catch(() => null);
    const message = renderMessage(this.type(), {
      entreprise: this.companyName() || 'votre entreprise',
      poste: this.position() || 'le poste',
      prenom: profile?.firstName ?? '',
      signature: buildSignature(profile),
    });
    this.subject.set(message.subject);
    this.body.set(message.body);
    this.lastTemplate.set(message.body);
    this.aiGenerated.set(false);
  }

  async writeWithAi(): Promise<void> {
    if (this.aiLoading()) return;
    this.aiLoading.set(true);
    try {
      const message = await this.ai.freeMessage({
        type: this.type(),
        companyName: this.companyName() || 'votre entreprise',
        position: this.position() || undefined,
      });
      this.subject.set(message.subject);
      this.body.set(message.body);
      this.lastTemplate.set('');
      this.aiGenerated.set(message.aiGenerated);
    } catch {
      // IA indisponible ou non autorisée : on garde le message déjà affiché.
    } finally {
      this.aiLoading.set(false);
    }
  }

  async onSent(message: ComposedMessage): Promise<void> {
    if (this.saving()) return;
    if (!this.companyName().trim()) {
      this.error.set("Indique au moins le nom de l'entreprise.");
      return;
    }
    if (!message.to.trim()) {
      this.error.set("Ajoute l'email du destinataire dans le champ « Destinataire ».");
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.applications.freeSend({
        type: this.type(),
        companyName: this.companyName(),
        contactEmail: message.to,
        position: this.position() || undefined,
        subject: message.subject,
        body: message.body,
        channel: message.channel,
      });
      this.done.emit();
    } catch {
      this.error.set('Envoi impossible (limite atteinte ?). Réessaie.');
    } finally {
      this.saving.set(false);
    }
  }
}
