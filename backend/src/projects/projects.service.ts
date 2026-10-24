import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectInput, validateProject } from './project-validation';
import { ServicesService } from '../services/services.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly repo: Repository<Project>,
    private readonly services: ServicesService,
  ) {}

  private fail(errors: Record<string, string>): never {
    const n = Object.keys(errors).length;
    throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
  }

  private async categories() {
    return Array.from((await this.services.labels()).keys()).filter((k) => k !== 'other');
  }

  /** Public: published projects in admin order, optionally one service. */
  async listPublished(category?: string) {
    const labels = await this.services.labels();
    const where: Record<string, unknown> = { published: true };
    if (category) where.category = String(category).slice(0, 40);
    const rows = await this.repo.find({ where, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((p) => ({
      id: p.id,
      category: p.category,
      categoryLabel: labels.get(p.category) || p.category,
      title: p.title,
      description: p.description,
      image: p.image,
      imageAlt: p.imageAlt || `Photo: ${p.title}`,
      imageBrief: p.imageBrief || p.title,
      ratio: p.ratio || '4/5',
      location: p.location,
      beforeImage: p.beforeImage,
      afterImage: p.afterImage,
      featured: p.featured,
      illustrative: p.illustrative,
    }));
  }

  // ---------- admin ----------

  async adminList(p: { q?: string; category?: string; status?: string }) {
    const labels = await this.services.labels();
    const qb = this.repo.createQueryBuilder('x');
    if (p.category) qb.andWhere('x.category = :c', { c: p.category });
    if (p.status === 'published') qb.andWhere('x.published = 1');
    if (p.status === 'hidden') qb.andWhere('x.published = 0');
    const q = (p.q || '').trim().toLowerCase().slice(0, 100);
    if (q) qb.andWhere("(LOWER(x.title) LIKE :q ESCAPE '\\' OR LOWER(x.description) LIKE :q ESCAPE '\\')", { q: `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` });
    const items = await qb.orderBy('x.sortOrder', 'ASC').addOrderBy('x.id', 'ASC').getMany();
    return {
      items: items.map((x) => ({ ...x, categoryLabel: labels.get(x.category) || x.category })),
      total: await this.repo.count(),
      categories: Array.from(labels.entries()).filter(([k]) => k !== 'other').map(([value, label]) => ({ value, label })),
    };
  }

  async create(body: ProjectInput) {
    const { value, errors } = validateProject(body, await this.categories());
    if (Object.keys(errors).length) this.fail(errors);
    const max = await this.repo.createQueryBuilder('x').select('MAX(x.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    return this.repo.save(this.repo.create({ ...value, sortOrder: (max?.max ?? 0) + 1 }));
  }

  async update(id: number, body: ProjectInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found.');
    const { value, errors } = validateProject({ ...row, ...body }, await this.categories());
    if (Object.keys(errors).length) this.fail(errors);
    Object.assign(row, value);
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(ids: number[]) {
    const rows = await this.repo.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length || rows.length !== (await this.repo.count())) throw new BadRequestException('Reorder list must contain every project once.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return (await this.adminList({})).items;
  }

  /** Seeder: idempotent (runs after services are seeded). */
  async seed(items: ProjectInput[]) {
    if ((await this.repo.count()) > 0) return 0;
    const cats = await this.categories();
    await this.repo.save(items.map((it, i) => this.repo.create({ ...validateProject(it, cats).value, sortOrder: i + 1 })));
    return items.length;
  }
}
