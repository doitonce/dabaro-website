import nodemailer from 'nodemailer';
import type { Inquiry } from '@shared/schema';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private companyEmail: string;

  constructor(config: EmailConfig, companyEmail: string) {
    this.companyEmail = companyEmail;
    this.transporter = nodemailer.createTransport(config);
  }

  async sendInquiryNotification(inquiry: Inquiry): Promise<boolean> {
    try {
      const recipients = [
        process.env.EMAIL_USER, // Gmail account
        'dabaro0432@naver.com'   // Naver account
      ].filter(Boolean) as string[];

      console.log('Sending email to recipients:', recipients);

      const mailOptions = {
        from: this.companyEmail,
        to: recipients,
        subject: `[다바로] 새로운 문의: ${inquiry.inquiryType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              새로운 문의가 접수되었습니다
            </h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">문의 정보</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">이름:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">회사명:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.company}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">연락처:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">이메일:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">문의 유형:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${inquiry.inquiryType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">문의 내용:</td>
                  <td style="padding: 8px 0;">${inquiry.message.replace(/\n/g, '<br>')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>접수 시간:</strong> ${new Date(inquiry.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>이 메일은 다바로 홈페이지 문의 폼에서 자동으로 발송되었습니다.</p>
            </div>
          </div>
        `,
        replyTo: inquiry.email
      };

      const result = await this.transporter.sendMail(mailOptions) as any;
      console.log('Email sent successfully:', {
        messageId: result?.messageId,
        accepted: result?.accepted,
        rejected: result?.rejected,
        recipients: recipients
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Default email service instance (will be configured based on environment variables)
let emailService: EmailService | null = null;

export function initializeEmailService(): EmailService | null {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const companyEmail = process.env.COMPANY_EMAIL || 'dabaro0432@naver.com';

  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    console.warn('Email configuration incomplete. Email service disabled.');
    return null;
  }

  const config: EmailConfig = {
    host: emailHost,
    port: parseInt(emailPort),
    secure: parseInt(emailPort) === 465,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  };

  console.log(`Initializing email service with host: ${emailHost}, port: ${emailPort}, user: ${emailUser}`);
  console.log(`Secure mode: ${parseInt(emailPort) === 465}`);

  emailService = new EmailService(config, companyEmail);
  return emailService;
}

export function getEmailService(): EmailService | null {
  return emailService;
}