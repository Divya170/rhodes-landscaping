import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';
import { UpdateSettingsDto } from './settings.dto';
import { mapsHref, telHref } from '../common/utils';
import { SETTINGS_SEED } from '../database/seed-data';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Settings) private readonly repo: Repository<Settings>) {}

  async ensure(): Promise<Settings> {
    const existing = await this.repo.findOne({ where: { id: 1 } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ id: 1, ...SETTINGS_SEED }));
  }

  get(): Promise<Settings> {
    return this.ensure();
  }

  async getPublic() {
    const s = await this.ensure();
    const address = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    return {
      businessName: s.businessName,
      contactName: s.contactName,
      phone: s.phone,
      telHref: telHref(s.phone),
      email: s.email,
      mailHref: s.email ? `mailto:${s.email}` : null,
      addressLine1: s.addressLine1,
      addressLine2: s.addressLine2,
      address,
      mapHref: mapsHref(address),
      locationLabel: s.locationLabel,
      tagline: s.tagline,
      aboutLead: s.aboutLead,
      aboutBody: s.aboutBody,
      privacyPolicy: s.privacyPolicy,
      heroStyle: s.heroStyle === 'split' ? 'split' : 'fullbleed',
      showReviewNotes: s.showReviewNotes,
      estimatesOpen: s.estimatesOpen,
      photoUploadsOpen: s.photoUploadsOpen,
    };
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const s = await this.ensure();
    const nullable = (v: string | null | undefined) => (v === undefined ? undefined : v === null || v.trim() === '' ? null : v.trim());
    const email = nullable(dto.email);
    if (email !== undefined) s.email = email ? email.toLowerCase() : null;
    for (const k of ['phone', 'addressLine1', 'addressLine2'] as const) {
      const v = nullable(dto[k]);
      if (v !== undefined) s[k] = v;
    }
    for (const k of ['businessName', 'contactName', 'locationLabel', 'tagline', 'aboutLead', 'aboutBody', 'privacyPolicy', 'heroStyle'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v.replace(/\r\n/g, '\n').trim();
    }
    for (const k of ['showReviewNotes', 'estimatesOpen', 'photoUploadsOpen'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v;
    }
    return this.repo.save(s);
  }
}
