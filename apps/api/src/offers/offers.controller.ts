import { Body, Controller, Get, HttpCode, Param, Post, Query, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { searchOffersSchema, type SearchOffersInput, type SearchResult } from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { OffersService } from './offers.service';

const appliedSchema = z.object({ contactEmail: z.string().trim().email().max(254).optional() });

@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get('search')
  search(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(searchOffersSchema)) query: SearchOffersInput,
  ): Promise<SearchResult> {
    return this.offers.search({ id: user.id, plan: user.plan, role: user.role }, query);
  }

  @Post(':id/applied')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(appliedSchema))
  applied(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { contactEmail?: string },
  ): Promise<{ duplicate: boolean }> {
    return this.offers.markApplied(
      { id: user.id, plan: user.plan, role: user.role },
      id,
      body.contactEmail,
    );
  }

  @Post(':id/hide')
  @HttpCode(204)
  async hide(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<void> {
    await this.offers.hide(user.id, id);
  }
}
