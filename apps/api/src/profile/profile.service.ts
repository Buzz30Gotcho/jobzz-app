import { Injectable } from '@nestjs/common';
import type { Prisma, Profile } from '@prisma/client';
import {
  computeProfileCompletion,
  type ProfileUpdateInput,
  type PublicProfile,
  type AlternanceDetails,
  type InternshipDetails,
  type JobTarget,
  type ProfileLocation,
  type ContractType,
  type ExperienceLevel,
  type RemotePreference,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Convertit une `Date` (date de début) vers `YYYY-MM-DD`, ou `null`. */
function toDateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Récupère le profil de l'utilisateur (vide mais valide s'il n'existe pas encore). */
  async get(userId: string): Promise<PublicProfile> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const hasCv = (await this.prisma.cvDocument.count({ where: { userId } })) > 0;
    return this.toPublicProfile(profile, hasCv);
  }

  /** Crée ou met à jour le profil (upsert) à partir d'un corps déjà validé par Zod. */
  async update(userId: string, input: ProfileUpdateInput): Promise<PublicProfile> {
    // Champs communs à la création et à la mise à jour (sans `userId`, propre à la création).
    const fields: Prisma.ProfileUpdateInput = {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      linkedinUrl: input.linkedinUrl,
      links: input.links,
      jobTargets: input.jobTargets,
      skills: input.skills,
      sectors: input.sectors,
      locations: input.locations,
      remotePreference: input.remotePreference,
      educationLevel: input.educationLevel,
      educationField: input.educationField,
      availableFrom: input.availableFrom ? new Date(`${input.availableFrom}T00:00:00.000Z`) : null,
      contractTypes: input.contractTypes,
      alternance: input.alternance ?? undefined,
      internship: input.internship ?? undefined,
      experienceLevel: input.experienceLevel,
    };

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...fields } as Prisma.ProfileUncheckedCreateInput,
      update: fields,
    });
    const hasCv = (await this.prisma.cvDocument.count({ where: { userId } })) > 0;
    return this.toPublicProfile(profile, hasCv);
  }

  /** Normalise une ligne Prisma (champs JSON) vers la forme publique + complétude. */
  private toPublicProfile(profile: Profile | null, hasCv: boolean): PublicProfile {
    const base: Omit<PublicProfile, 'completion'> = {
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      phone: profile?.phone ?? null,
      linkedinUrl: profile?.linkedinUrl ?? null,
      links: (profile?.links as string[] | undefined) ?? [],
      jobTargets: (profile?.jobTargets as JobTarget[] | undefined) ?? [],
      skills: (profile?.skills as string[] | undefined) ?? [],
      sectors: (profile?.sectors as string[] | undefined) ?? [],
      locations: (profile?.locations as ProfileLocation[] | undefined) ?? [],
      remotePreference: (profile?.remotePreference as RemotePreference | null) ?? null,
      educationLevel: profile?.educationLevel ?? null,
      educationField: profile?.educationField ?? null,
      availableFrom: toDateOnly(profile?.availableFrom ?? null),
      contractTypes: (profile?.contractTypes as ContractType[] | undefined) ?? [],
      alternance: (profile?.alternance as AlternanceDetails | null) ?? null,
      internship: (profile?.internship as InternshipDetails | null) ?? null,
      experienceLevel: (profile?.experienceLevel as ExperienceLevel | null) ?? null,
    };

    return {
      ...base,
      completion: computeProfileCompletion({
        jobTargets: base.jobTargets,
        contractTypes: base.contractTypes,
        locations: base.locations,
        availableFrom: base.availableFrom,
        skills: base.skills,
        sectors: base.sectors,
        linkedinUrl: base.linkedinUrl,
        remotePreference: base.remotePreference,
        hasCv,
      }),
    };
  }
}
