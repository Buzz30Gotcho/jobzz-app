import { Component } from '@angular/core';

/**
 * Page de désinscription du mail des offres (lien en un clic dans les mails).
 * Le traitement du jeton signé arrive à l'étape 6 ; ici, la page de confirmation.
 */
@Component({
  selector: 'jz-desinscription',
  standalone: true,
  template: `
    <section class="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 class="text-2xl font-bold">Désinscription du mail des offres</h1>
      <p class="mt-4 text-text-secondary">
        Cette page coupera l'envoi du mail des offres. Ton compte et tes données restent intacts.
      </p>
      <p class="mt-2 text-sm text-text-muted">La gestion du lien de désinscription arrive à l'étape 6.</p>
    </section>
  `,
})
export class DesinscriptionComponent {}
