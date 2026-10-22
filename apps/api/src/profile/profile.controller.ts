import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import {
  addSkillsSchema,
  profileUpdateSchema,
  type AddSkillsInput,
  type ProfileUpdateInput,
  type PublicProfile,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { ProfileService } from './profile.service';

/** Profil de l'utilisateur connecté (CLAUDE.md §4.2). Chacun n'accède qu'à son propre profil. */
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@CurrentUser() user: RequestUser): Promise<PublicProfile> {
    return this.profile.get(user.id);
  }

  @Put()
  update(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(profileUpdateSchema)) body: ProfileUpdateInput,
  ): Promise<PublicProfile> {
    return this.profile.update(user.id, body);
  }

  @Post('skills')
  addSkills(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(addSkillsSchema)) body: AddSkillsInput,
  ): Promise<PublicProfile> {
    return this.profile.addSkills(user.id, body.skills);
  }
}
