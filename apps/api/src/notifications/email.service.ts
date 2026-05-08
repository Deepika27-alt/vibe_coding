import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const from = this.configService.get<string>('SMTP_FROM');
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html: this.wrapHtmlWithTemplate(htmlContent),
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }

  private wrapHtmlWithTemplate(content: string): string {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 40px; margin-bottom: 40px; }
          .header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; text-decoration: none; }
          .content { color: #374151; line-height: 1.6; }
          .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 20px;">
          <tr>
            <td align="center">
              <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
                <tr>
                  <td class="header">
                    <a href="${appUrl}" class="logo">Company Logo</a>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    &copy; ${new Date().getFullYear()} Workflow Engine. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
