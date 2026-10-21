import { Body, Controller, Get, Put, UsePipes } from '@nestjs/common';
import { profileUpdateSchema, type ProfileUpdateInput, type PublicProfile } from '@jobzz/shared';
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
  @UsePipes(new ZodValidationPipe(profileUpdateSchema))
  update(
    @CurrentUser() user: RequestUser,
    @Body() body: ProfileUpdateInput,
  ): Promise<PublicProfile> {
    return this.profile.update(user.id, body);
  }
}
