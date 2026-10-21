import { Global, Module } from '@nestjs/common';
import { MailSender, NodemailerMailSender } from './mail.service';

@Global()
@Module({
  providers: [{ provide: MailSender, useClass: NodemailerMailSender }],
  exports: [MailSender],
})
export class MailModule {}
