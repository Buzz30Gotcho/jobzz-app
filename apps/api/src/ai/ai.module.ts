import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { AI_PROVIDER } from './ai-provider';
import { OllamaProvider } from './ollama.provider';
import { AiService } from './ai.service';
import { AiMessagesService } from './ai-messages.service';
import { AiController } from './ai.controller';

/**
 * Couche IA (CLAUDE.md §5). Le fournisseur par défaut est Ollama ; `AI_PROVIDER` permet d'en
 * changer sans toucher au reste. EntitlementsService est fourni globalement.
 */
@Module({
  imports: [ProfileModule],
  controllers: [AiController],
  providers: [
    OllamaProvider,
    { provide: AI_PROVIDER, useExisting: OllamaProvider },
    AiService,
    AiMessagesService,
  ],
  exports: [AiService, AiMessagesService],
})
export class AiModule {}
