/**
 * Données de démonstration (CLAUDE.md §12). JAMAIS exécuté en production.
 *   pnpm seed
 *
 * Crée :
 *  - demo@jobzz.local (premium) : profil complet, candidatures variées, relances à faire,
 *    candidature sans email, un entretien, 2 automatisations, un « J'ai trouvé ! » ;
 *  - gratuit@jobzz.local (free) : pour tester les limites avec PLAN_ENFORCEMENT=true ;
 *  - quelques comptes fictifs pour alimenter les statistiques admin.
 * Entreprises et personnes clairement fictives.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { normalizeKey } from '../src/common/normalize';

loadEnv({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo-jobzz-2026';

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function upsertUser(data: {
  email: string;
  plan?: 'free' | 'premium';
  verified?: boolean;
  createdAt?: Date;
}): Promise<User> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  return prisma.user.upsert({
    where: { email: data.email },
    update: { plan: data.plan ?? 'free' },
    create: {
      email: data.email,
      passwordHash,
      plan: data.plan ?? 'free',
      emailVerifiedAt: data.verified === false ? null : new Date(),
      createdAt: data.createdAt ?? new Date(),
      lastActiveAt: new Date(),
    },
  });
}

async function createApplication(
  userId: string,
  app: {
    companyName: string;
    position: string;
    contactEmail?: string | null;
    appliedAt: Date;
    status?: 'en_attente' | 'relancee' | 'reponse_recue';
    responseType?: 'entretien' | 'refus' | 'autre';
    nextFollowUpAt?: Date | null;
    source?: 'offer' | 'free_send';
  },
): Promise<void> {
  await prisma.application.create({
    data: {
      userId,
      companyName: app.companyName,
      companyKey: normalizeKey(app.companyName),
      position: app.position,
      positionKey: normalizeKey(app.position),
      contactEmail: app.contactEmail ?? null,
      appliedAt: app.appliedAt,
      source: app.source ?? 'offer',
      status: app.status ?? 'en_attente',
      responseType: app.responseType ?? null,
      respondedAt: app.responseType ? daysAgo(1) : null,
      nextFollowUpAt: app.nextFollowUpAt ?? null,
      followUpCount: app.status === 'relancee' ? 1 : 0,
      lastFollowUpAt: app.status === 'relancee' ? daysAgo(2) : null,
    },
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Le seed démo ne doit jamais être exécuté en production.');
  }

  console.log('Nettoyage des comptes de démonstration…');
  const demoEmails = [
    'demo@jobzz.local',
    'gratuit@jobzz.local',
    'lea.martin@jobzz.local',
    'tom.durand@jobzz.local',
    'nadia.bencheikh@jobzz.local',
  ];
  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });

  // ── Compte démo principal (premium) ──
  const demo = await upsertUser({ email: 'demo@jobzz.local', plan: 'premium', createdAt: daysAgo(40) });
  await prisma.profile.create({
    data: {
      userId: demo.id,
      firstName: 'Frédéric',
      lastName: 'Démo',
      phone: '06 12 34 56 78',
      linkedinUrl: 'https://www.linkedin.com/in/frederic-demo',
      jobTargets: [{ label: 'Développeur web', romeCodes: ['M1805'] }],
      skills: ['JavaScript', 'TypeScript', 'Angular', 'NestJS', 'SQL', 'Git'],
      sectors: ['Informatique'],
      locations: [
        { communeCode: '34172', label: 'Montpellier', lat: 43.611, lng: 3.877, radiusKm: 30 },
      ],
      remotePreference: 'accepte',
      educationLevel: 'Bac+5',
      educationField: 'Informatique',
      availableFrom: daysFromNow(60),
      contractTypes: ['alternance', 'cdi'],
      alternance: { rythme: '3 sem. entreprise / 1 sem. école', dureeMois: 24, ecole: 'Ynov' },
      experienceLevel: 'debutant',
    },
  });

  // Candidatures variées.
  await createApplication(demo.id, {
    companyName: 'Studio Pixel SARL',
    position: 'Développeur front-end alternance',
    contactEmail: 'recrutement@studiopixel.demo',
    appliedAt: daysAgo(9),
    status: 'en_attente',
    nextFollowUpAt: daysAgo(2), // en retard → « À buzzer »
  });
  await createApplication(demo.id, {
    companyName: 'Vert Logiciel',
    position: 'Développeur back-end Java',
    contactEmail: 'jobs@vertlogiciel.demo',
    appliedAt: daysAgo(10),
    status: 'relancee',
  });
  await createApplication(demo.id, {
    companyName: 'Data Garance',
    position: 'Data analyst junior',
    contactEmail: 'rh@datagarance.demo',
    appliedAt: daysAgo(14),
    status: 'reponse_recue',
    responseType: 'entretien',
  });
  await createApplication(demo.id, {
    companyName: 'Mairie de Lunéville',
    position: 'Chargé de communication',
    contactEmail: null, // sans email → canal LinkedIn
    appliedAt: daysAgo(6),
    status: 'en_attente',
    nextFollowUpAt: daysFromNow(1),
  });
  await createApplication(demo.id, {
    companyName: 'Boulangerie du Causse',
    position: 'Vendeur en alternance',
    contactEmail: 'contact@boulangeriecausse.demo',
    appliedAt: daysAgo(20),
    status: 'reponse_recue',
    responseType: 'refus',
    source: 'free_send',
  });

  // Automatisations.
  await prisma.automation.create({
    data: {
      userId: demo.id,
      name: 'Alternance dev web · Montpellier',
      requestText: "Alternance en développement web à Montpellier ou en télétravail, début automne.",
      status: 'active',
      lastRunAt: daysAgo(0),
      lastSuccessAt: daysAgo(0),
      criteria: {
        schemaVersion: 1,
        jobTargets: [{ label: 'Développeur web', romeCodes: ['M1805'] }],
        contractTypes: ['alternance'],
        locations: [{ communeCode: '34172', label: 'Montpellier', radiusKm: 30 }],
        remote: 'accepte',
        minScore: 60,
      },
    },
  });
  await prisma.automation.create({
    data: {
      userId: demo.id,
      name: 'CDI junior data · Paris / télétravail',
      status: 'en_pause',
      criteria: {
        schemaVersion: 1,
        jobTargets: [{ label: 'Data analyst', romeCodes: ['M1403'] }],
        contractTypes: ['cdi'],
        locations: [{ communeCode: '75056', label: 'Paris', radiusKm: 20 }],
        remote: 'souhaite',
        minScore: 60,
      },
    },
  });

  // ── Compte gratuit (pour tester les limites) ──
  const gratuit = await upsertUser({ email: 'gratuit@jobzz.local', plan: 'free', createdAt: daysAgo(15) });
  await prisma.profile.create({
    data: {
      userId: gratuit.id,
      firstName: 'Léna',
      jobTargets: [{ label: 'Assistant RH', romeCodes: ['M1501'] }],
      skills: ['Pack Office', 'Communication'],
      locations: [
        { communeCode: '69123', label: 'Lyon', lat: 45.757, lng: 4.832, radiusKm: 25 },
      ],
      contractTypes: ['stage'],
      experienceLevel: 'debutant',
    },
  });

  // ── Comptes fictifs pour les statistiques admin ──
  const lea = await upsertUser({ email: 'lea.martin@jobzz.local', plan: 'premium', createdAt: daysAgo(60) });
  const tom = await upsertUser({ email: 'tom.durand@jobzz.local', plan: 'free', createdAt: daysAgo(30) });
  const nadia = await upsertUser({ email: 'nadia.bencheikh@jobzz.local', plan: 'free', createdAt: daysAgo(5) });

  await prisma.jobOutcome.createMany({
    data: [
      { userId: lea.id, contractType: 'alternance', companyName: 'Vert Logiciel', helpfulness: 'beaucoup', foundAt: daysAgo(3) },
      { userId: tom.id, contractType: 'stage', helpfulness: 'un_peu', foundAt: daysAgo(12) },
    ],
  });
  await createApplication(nadia.id, {
    companyName: 'Clinique des Tilleuls',
    position: 'Secrétaire médical alternance',
    contactEmail: 'rh@tilleuls.demo',
    appliedAt: daysAgo(8),
    status: 'en_attente',
    nextFollowUpAt: daysAgo(1),
  });

  console.log('Seed terminé.');
  console.log(`  demo@jobzz.local    (premium) — mot de passe : ${DEMO_PASSWORD}`);
  console.log(`  gratuit@jobzz.local (free)    — mot de passe : ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
