import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Petit clin d'œil dev dans la console (CLAUDE.md §11).
console.log(
  '%cJobzz%c — tu lis la console ? On va bien s’entendre. ⚡',
  'color:#3BE38B;font-weight:700',
  'color:#A3ADA7',
);

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error(err);
});
