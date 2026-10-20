import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { AppConfigService } from '../config/app-config.service';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

/**
 * Interface d'envoi de mail. Le reste de l'app dépend de cette abstraction, jamais de
 * Nodemailer directement (cf. CLAUDE.md §7). En local : Mailpit.
 */
export abstract class MailSender {
  abstract send(message: MailMessage): Promise<void>;
}

@Injectable()
export class NodemailerMailSender extends MailSender {
  private readonly logger = new Logger(NodemailerMailSender.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: AppConfigService) {
    super();
    this.from = this.config.get('MAIL_FROM');
    this.transporter = createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      secure: false,
      // Mailpit accepte tout ; pas d'authentification en local.
      ignoreTLS: true,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
    });
    this.logger.log(`Mail envoyé « ${message.subject} »`);
  }
}
