import { Component, OnInit, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { buildMailLinks, type FollowUpChannel } from '@jobzz/shared';

export interface ComposedMessage {
  channel: FollowUpChannel;
  subject: string;
  body: string;
}

/**
 * Compositeur de message (CLAUDE.md §4.3) : destinataire, objet, corps modifiable, aperçu, et
 * boutons d'envoi (Gmail, Outlook, messagerie, Copier). Jobzz **n'envoie rien** : il ouvre la
 * messagerie de l'utilisateur. Au retour, « C'est envoyé ? » confirme et enregistre la relance.
 *
 * `subject` et `body` sont en liaison `model` : le parent peut les remplacer (ex. version IA).
 */
@Component({
  selector: 'jz-message-composer',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      <div>
        <label class="jz-label" for="mc-to">Destinataire</label>
        <input id="mc-to" class="jz-input" [(ngModel)]="toValue" [readOnly]="lockRecipient()" />
      </div>
      <div>
        <label class="jz-label" for="mc-subject">Objet</label>
        <input id="mc-subject" class="jz-input" [ngModel]="subject()" (ngModelChange)="subject.set($event)" />
      </div>
      <div>
        <label class="jz-label" for="mc-body">Message</label>
        <textarea id="mc-body" rows="8" class="jz-input resize-y" [ngModel]="body()" (ngModelChange)="body.set($event)"></textarea>
      </div>

      @if (links().tooLong) {
        <p class="text-xs text-warning">Le message est long : utilise « Copier » puis colle-le dans ta messagerie.</p>
      }

      <div class="flex flex-wrap gap-2">
        <a class="jz-btn-primary" [href]="links().gmail" target="_blank" rel="noopener" (click)="pick('gmail')">
          <lucide-icon name="mail" [size]="16" /> Gmail
        </a>
        <a class="jz-btn-ghost" [href]="links().outlook" target="_blank" rel="noopener" (click)="pick('outlook')">Outlook</a>
        <a class="jz-btn-ghost" [href]="links().mailto" (click)="pick('mailto')">Ma messagerie</a>
        <button type="button" class="jz-btn-ghost" (click)="copy()">
          <lucide-icon name="copy" [size]="16" /> {{ copied() ? 'Copié' : 'Copier' }}
        </button>
      </div>

      <div class="rounded-field border border-border bg-surface-raised p-3">
        <p class="text-sm font-medium">C'est envoyé ?</p>
        <p class="mt-0.5 text-xs text-text-secondary">On l'enregistre seulement si tu confirmes.</p>
        <div class="mt-3 flex gap-2">
          <button type="button" class="jz-btn-primary" [disabled]="saving()" (click)="confirm()">
            {{ saving() ? 'Enregistrement…' : 'Oui, c\\'est envoyé' }}
          </button>
          <button type="button" class="jz-btn-ghost" (click)="cancelled.emit()">Pas encore</button>
        </div>
      </div>
    </div>
  `,
})
export class MessageComposerComponent implements OnInit {
  readonly to = input('');
  readonly lockRecipient = input(false);
  readonly saving = input(false);

  readonly subject = model('');
  readonly body = model('');

  readonly sent = output<ComposedMessage>();
  readonly cancelled = output<void>();

  toValue = '';
  readonly copied = signal(false);
  private channel: FollowUpChannel = 'copy';

  readonly links = computed(() => buildMailLinks({ to: this.toValue, subject: this.subject(), body: this.body() }));

  ngOnInit(): void {
    this.toValue = this.to();
  }

  pick(channel: FollowUpChannel): void {
    this.channel = channel;
  }

  async copy(): Promise<void> {
    const text = this.subject() ? `${this.subject()}\n\n${this.body()}` : this.body();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Presse-papiers indisponible : l'utilisateur peut sélectionner le texte à la main.
    }
    this.channel = 'copy';
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  confirm(): void {
    this.sent.emit({ channel: this.channel, subject: this.subject(), body: this.body() });
  }
}
