import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Service } from './service.entity';
import { ServiceInput, validateService } from './service-validation';
import { slugify } from '../common/utils';
import type { ServiceSeed } from '../database/seed-data';

export const OTHER = { value: 'other', label: 'Other' };

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private readonly repo: Repository<Service>) {}

  /** Published services in admin order, numbered 01, 02, … */
  async listPublished() {
    const rows: Service[] = await this.repo.find({ where: { published: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((s, i) => ({
      id: s.id,
      slug: s.slug,
      n: String(i + 1).padStart(2, '0'),
      name: s.name,
      summary: s.summary,
      description: s.description,
      benefits: s.benefits || [],
      includes: s.includes || [],
      ctaLabel: s.ctaLabel || 'Request an Estimate',
      image: s.image,
      homeImage: s.homeImage || s.image,
      detailImage: s.detailImage,
      detailImage2: s.detailImage2,
      imageAlt: s.imageAlt || `Photo: ${s.name}`,
      imageBrief: s.imageBrief || s.name,
    }));
  }

  /** Estimate form "Project type": published services + "Other". */
  async projectTypes() {
    return [...(await this.listPublished()).map((s) => ({ value: s.slug, label: s.name })), OTHER];
  }

  /** slug → name for every service (unpublished too, so old leads and projects keep a label). */
  async labels(): Promise<Map<string, string>> {
    const rows: Service[] = await this.repo.find();
    const m = new Map<string, string>(rows.map((r) => [r.slug, r.name]));
    m.set(OTHER.value, OTHER.label);
    return m;
  }

  adminList() {
    return this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  private fail(errors: Record<string, string>): never {
    const n = Object.keys(errors).length;
    throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
  }

  private async uniqueSlug(base: string) {
    const root = base && base !== 'other' ? base : 'service';
    let slug = root;
    for (let i = 2; await this.repo.findOne({ where: { slug } }); i++) slug = `${root}-${i}`;
    return slug;
  }

  async create(body: ServiceInput) {
    const { value, errors } = validateService(body);
    if (Object.keys(errors).length) this.fail(errors);
    const max = await this.repo.createQueryBuilder('s').select('MAX(s.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const slug = await this.uniqueSlug(value.slug || slugify(value.name).slice(0, 40));
    return this.repo.save(this.repo.create({ ...value, slug, sortOrder: (max?.max ?? 0) + 1 }));
  }

  async update(id: number, body: ServiceInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Service not found.');
    // slug is fixed after creation so stored enquiries and links keep working
    const { value, errors } = validateService({ ...row, ...body, slug: row.slug });
    if (Object.keys(errors).length) this.fail(errors);
    Object.assign(row, { ...value, slug: row.slug });
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Service not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(ids: number[]) {
    const rows = await this.repo.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match the services.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return this.adminList();
  }

  async seed(items: ServiceSeed[]) {
    if ((await this.repo.count()) > 0) return 0;
    await this.repo.save(items.map((s, i) => this.repo.create({ ...validateService({ ...s, published: true }).value, slug: s.slug, sortOrder: i + 1 })));
    return items.length;
  }
}
