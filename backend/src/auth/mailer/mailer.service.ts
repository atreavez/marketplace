import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

// NOT a production email sender. Every "send" just logs the message,
// including the full verification/reset link, so the flow is fully testable
// locally without any provider credentials. Swap this class's `send` method
// for a real provider (SendGrid/SES/Postmark/etc.) — nothing in
// AuthService/EmailVerificationService/PasswordResetService needs to change,
// they only depend on this interface.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private config: ConfigService) {}

  async send(payload: EmailPayload): Promise<void> {
    this.logger.log(
      `[DEV MAILER] To: ${payload.to} | Subject: ${payload.subject}\n${payload.body}`,
    );
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${this.config.get<string>('app.frontendUrl')}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your email',
      body: `Confirm your email address: ${url}\n\nThis link expires in 24 hours.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${this.config.get<string>('app.frontendUrl')}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your password',
      body: `Reset your password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    });
  }
}
