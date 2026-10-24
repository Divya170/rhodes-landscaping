import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** HTML-encode user text for email output (stored as plain text, encoded on output). */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/**
 * Owner notifications and customer acknowledgements for estimate requests. Enabled only when SMTP_HOST
 * is set; otherwise submissions are stored with notify_status = "disabled".
 */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger('Notifier');
  private transporter: Transporter | null = null;

  get configured() {
    return !!process.env.SMTP_HOST;
  }

  private transport(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
      });
    }
    return this.transporter;
  }

  async send(opts: { to: string | null; replyTo: string; subject: string; rows: [string, string][]; body: string; link: string }) {
    const to = opts.to;
    if (!to) throw new Error('No recipient: set NOTIFY_TO or the business email in Settings.');
    await this.transport().sendMail({
      from: process.env.NOTIFY_FROM || 'Rhodes Landscaping <no-reply@localhost>',
      to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: `${opts.rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${opts.body}${opts.link ? `\n\nOpen in admin: ${opts.link}` : ''}`,
      html: `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${opts.rows
        .map(([k, v]) => `<tr><td style="color:#68737D">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
        .join('')}</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;background:#F7F7F5;padding:12px">${esc(opts.body)}</p>${opts.link ? `<p><a href="${esc(opts.link)}">Open in admin</a></p>` : ''}`,
    });
  }

  adminUrl(path: string) {
    return `${(process.env.ADMIN_URL || 'http://localhost:3000/admin').replace(/\/$/, '')}${path}`;
  }

  log(event: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ event, ...data }));
  }
}
