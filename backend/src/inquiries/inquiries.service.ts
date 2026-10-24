import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, LessThan, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { EstimateRequest } from './estimate-request.entity';
import { EstimateImage } from './estimate-image.entity';
import { EstimateInput, FormLists, MAX_IMAGES, safeName, sniffImage, stripMetadata, validateEstimate } from './estimate-validation';
import { csvSafe, isHoneypot, publicRef, RequestStatus, STATUS_LABELS } from '../common/forms';
import { FieldErrors } from '../common/submission-error';
import { NotifierService } from '../common/notifier.service';
import { HistoryService } from '../common/history.service';
import { applyFilters, paginate, RequestQuery, statusCounts } from '../common/request-query';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';
import { ServicesService } from '../services/services.service';

/** Private storage for lead photos — never served statically (Handoff: "private storage"). */
export const PRIVATE_UPLOAD_DIR = resolve(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || 'private-uploads');
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Photos uploaded but never attached to a sent request are deleted after this long. */
const ORPHAN_MS = 24 * 60 * 60 * 1000;

export const hashIp = (ip: string) => (ip ? createHash('sha256').update(`${process.env.SESSION_SECRET || 'dev'}:${ip}`).digest('hex').slice(0, 32) : '');

@Injectable()
export class InquiriesService implements OnModuleInit {
  private readonly logger = new Logger('EstimateRequests');

  constructor(
    @InjectRepository(EstimateRequest) private readonly repo: Repository<EstimateRequest>,
    @InjectRepository(EstimateImage) private readonly images: Repository<EstimateImage>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly services: ServicesService,
    private readonly notifier: NotifierService,
    private readonly history: HistoryService,
  ) {}

  onModuleInit() {
    mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
    void this.cleanupOrphans();
  }

  /** Valid form values: published services + "other", published area/timeline options. */
  async lists(): Promise<FormLists> {
    const rows = (await this.content.publicBundle(['form-option']))['form-option'];
    const pick = (list: string) => rows.filter((r) => r.list === list).map((r) => String(r.label || ''));
    return { projectTypes: (await this.services.projectTypes()).map((t) => t.value), area: pick('area'), timeline: pick('timeline') };
  }

  // ---------- public: uploads ----------

  async upload(file: { buffer: Buffer; originalname: string; size: number } | undefined, ip: string) {
    const s = await this.settings.get();
    if (!s.estimatesOpen || !s.photoUploadsOpen) throw new ServiceUnavailableException({ error: 'closed' });
    if (!file) throw new FieldErrors({ imageIds: 'Choose an image to upload.' });
    if (file.size > MAX_IMAGE_BYTES) throw new FieldErrors({ imageIds: `“${safeName(file.originalname)}” is over the 10 MB limit.` });
    const kind = sniffImage(file.buffer);
    if (!kind) throw new FieldErrors({ imageIds: `“${safeName(file.originalname)}” isn’t a supported format. Use JPG, PNG, or WebP.` });
    const id = randomBytes(16).toString('hex');
    const storedName = `${id}${kind.ext}`;
    const clean = stripMetadata(file.buffer, kind.mime);
    writeFileSync(join(PRIVATE_UPLOAD_DIR, storedName), clean, { mode: 0o600 });
    await this.images.save(this.images.create({ id, requestId: null, originalName: safeName(file.originalname), storedName, mime: kind.mime, size: clean.length, ipHash: hashIp(ip) }));
    void this.cleanupOrphans();
    // Files are private: the browser keeps its own local preview; admins view them through an authenticated route.
    return { imageId: id, url: null as string | null, name: safeName(file.originalname), size: clean.length };
  }

  async cleanupOrphans() {
    try {
      const old = await this.images.find({ where: { requestId: IsNull(), createdAt: LessThan(new Date(Date.now() - ORPHAN_MS)) } });
      for (const p of old) this.unlink(p.storedName);
      if (old.length) await this.images.remove(old);
    } catch (err) {
      this.logger.warn(JSON.stringify({ event: 'images.cleanup_failed', message: (err as Error).message }));
    }
  }

  private unlink(name: string) {
    const f = join(PRIVATE_UPLOAD_DIR, name);
    try {
      if (existsSync(f)) unlinkSync(f);
    } catch {
      /* already gone */
    }
  }

  // ---------- public: submit ----------

  async formOptions() {
    const s = await this.settings.get();
    return { open: s.estimatesOpen, photosOpen: s.estimatesOpen && s.photoUploadsOpen, maxImages: MAX_IMAGES, maxImageMb: MAX_IMAGE_BYTES / 1024 / 1024 };
  }

  async submit(input: EstimateInput, meta: { ip: string; idemKey: string | null }) {
    if (isHoneypot(input.website)) {
      this.logger.warn(JSON.stringify({ event: 'estimate.discarded', reason: 'honeypot' }));
      return { id: null as string | null, receivedAt: new Date().toISOString(), duplicate: false };
    }
    if (meta.idemKey) {
      const dup = await this.repo.findOne({ where: { idempotencyKey: meta.idemKey } });
      if (dup) return { id: dup.publicRef, receivedAt: dup.createdAt.toISOString(), duplicate: true };
    }
    const s = await this.settings.get();
    if (!s.estimatesOpen) throw new ServiceUnavailableException({ error: 'closed' });

    const { value, errors } = validateEstimate(input, await this.lists());
    let ids = s.photoUploadsOpen ? value.imageIds : [];
    if (ids.length) {
      const found = await this.images.find({ where: { id: In(ids), requestId: IsNull() } });
      if (found.length !== ids.length) errors.imageIds = 'One or more images could not be found. Remove them and add them again.';
      ids = found.map((p) => p.id);
    }
    if (Object.keys(errors).length) throw new FieldErrors(errors);

    const { imageIds: _i, ...fields } = value;
    let row: EstimateRequest;
    try {
      row = await this.dataSource.transaction(async (m) => {
        const repo = m.getRepository(EstimateRequest);
        const saved = await repo.save(
          repo.create({
            ...fields,
            status: 'new',
            notes: '',
            idempotencyKey: meta.idemKey,
            notificationState: this.notifier.configured ? 'pending' : 'disabled',
            acknowledgementState: this.notifier.configured ? 'pending' : 'disabled',
            ipHash: hashIp(meta.ip),
          }),
        );
        saved.publicRef = publicRef(saved.id);
        if (ids.length) await m.getRepository(EstimateImage).update({ id: In(ids) }, { requestId: saved.id });
        await this.history.record('estimate', saved.id, 'new', 'website', m);
        return repo.save(saved);
      });
    } catch (err) {
      if (meta.idemKey) {
        const dup = await this.repo.findOne({ where: { idempotencyKey: meta.idemKey } });
        if (dup) return { id: dup.publicRef, receivedAt: dup.createdAt.toISOString(), duplicate: true };
      }
      throw err;
    }
    this.logger.log(JSON.stringify({ event: 'estimate.created', ref: row.publicRef, type: row.projectType, images: ids.length }));
    if (this.notifier.configured) void this.notify(row, ids.length);
    return { id: row.publicRef, receivedAt: row.createdAt.toISOString(), duplicate: false };
  }

  /** Emails after commit — failures are recorded and never drop the request. */
  async notify(x: EstimateRequest, imageCount?: number, only?: 'owner' | 'customer') {
    const s = await this.settings.get();
    const type = (await this.services.labels()).get(x.projectType) || x.projectType;
    const n = imageCount ?? (await this.images.count({ where: { requestId: x.id } }));
    const rows: [string, string][] = [
      ['Reference', x.publicRef || String(x.id)],
      ['Project type', type],
      ['Timeline', x.timeline],
      ['Property location', x.location],
    ];
    if (only !== 'customer') {
      try {
        await this.notifier.send({
          to: process.env.NOTIFY_TO || s.email,
          replyTo: x.email,
          subject: `New estimate request ${x.publicRef} — ${type}`,
          rows: [...rows, ['Area', x.area || '—'], ['Name', x.name], ['Phone', x.phone], ['Email', x.email], ['Photos', n ? `${n} attached (view in admin)` : 'None']],
          body: x.details,
          link: this.notifier.adminUrl(`/leads/${x.id}`),
        });
        await this.repo.update({ id: x.id }, { notificationState: 'sent' });
      } catch {
        this.logger.error(JSON.stringify({ event: 'estimate.notify_failed', ref: x.publicRef }));
        await this.repo.update({ id: x.id }, { notificationState: 'failed' });
      }
    }
    if (only !== 'owner') {
      try {
        await this.notifier.send({
          to: x.email,
          replyTo: s.email || x.email,
          subject: `We received your estimate request (${x.publicRef})`,
          rows,
          body: `Thank you for reaching out to ${s.businessName}, ${x.name.split(' ')[0]}. Your project details have been received and we will be in touch using the phone number or email you provided.${s.phone ? `\n\nQuestions? Call ${s.phone}.` : ''}`,
          link: '',
        });
        await this.repo.update({ id: x.id }, { acknowledgementState: 'sent' });
      } catch {
        await this.repo.update({ id: x.id }, { acknowledgementState: 'failed' });
      }
    }
  }

  async resend(id: number) {
    if (!this.notifier.configured) throw new BadRequestException('Email is not configured (set SMTP_HOST in backend/.env).');
    const x = await this.get(id);
    await this.notify(x, undefined, x.notificationState === 'sent' ? 'customer' : x.acknowledgementState === 'sent' ? 'owner' : undefined);
    return this.detail(id);
  }

  // ---------- admin ----------

  private filtered(p: RequestQuery) {
    const qb = this.repo.createQueryBuilder('x');
    if (p.type) qb.andWhere('x.projectType = :type', { type: String(p.type).slice(0, 40) });
    return applyFilters(qb, p, ['publicRef', 'name', 'email', 'location', 'details', 'notes']);
  }

  private shape(r: EstimateRequest, labels: Map<string, string>) {
    return { ...r, ipHash: undefined, idempotencyKey: undefined, projectTypeLabel: labels.get(r.projectType) || r.projectType, statusLabel: STATUS_LABELS[r.status] || r.status };
  }

  counts() {
    return statusCounts(this.repo.createQueryBuilder('x'));
  }

  async list(p: RequestQuery) {
    const r = await paginate(this.filtered(p), p);
    const labels = await this.services.labels();
    const ids = r.items.map((x) => x.id);
    const pcs = ids.length
      ? await this.images
          .createQueryBuilder('p')
          .select('p.requestId', 'id')
          .addSelect('COUNT(*)', 'n')
          .where('p.requestId IN (:...ids)', { ids })
          .groupBy('p.requestId')
          .getRawMany<{ id: number; n: string }>()
      : [];
    const pc = new Map(pcs.map((x) => [Number(x.id), Number(x.n)]));
    return {
      ...r,
      items: r.items.map((x) => ({ ...this.shape(x, labels), imageCount: pc.get(x.id) || 0 })),
      counts: await this.counts(),
      types: Array.from(labels.entries()).map(([value, label]) => ({ value, label })),
      notificationsConfigured: this.notifier.configured,
    };
  }

  async get(id: number) {
    const x = await this.repo.findOne({ where: { id } });
    if (!x) throw new NotFoundException('Estimate request not found.');
    return x;
  }

  async detail(id: number) {
    const x = await this.get(id);
    const imgs = await this.images.find({ where: { requestId: id }, order: { createdAt: 'ASC' } });
    return {
      ...this.shape(x, await this.services.labels()),
      images: imgs.map((p) => ({ id: p.id, name: p.originalName, mime: p.mime, size: p.size, url: `/api/admin/estimate-requests/${id}/images/${p.id}` })),
      history: await this.history.list('estimate', id),
    };
  }

  async imageFile(id: number, imageId: string) {
    const p = await this.images.findOne({ where: { id: imageId, requestId: id } });
    if (!p) throw new NotFoundException('Image not found.');
    const path = join(PRIVATE_UPLOAD_DIR, p.storedName);
    if (!existsSync(path)) throw new NotFoundException('Image file is missing.');
    return { path, mime: p.mime, name: p.originalName };
  }

  async update(id: number, patch: { status?: string; notes?: string }, by: string) {
    const x = await this.get(id);
    if (patch.status !== undefined && patch.status !== x.status) {
      x.status = patch.status as RequestStatus;
      await this.history.record('estimate', id, x.status, by);
    }
    if (patch.notes !== undefined) x.notes = patch.notes.replace(/\r\n/g, '\n').trim();
    await this.repo.save(x);
    return this.detail(id);
  }

  /** Deleting a lead also deletes its image files and history (retention). */
  async remove(id: number) {
    const x = await this.get(id);
    const imgs = await this.images.find({ where: { requestId: id } });
    for (const p of imgs) this.unlink(p.storedName);
    if (imgs.length) await this.images.remove(imgs);
    await this.repo.remove(x);
    await this.history.remove('estimate', id);
    return { ok: true };
  }

  async exportCsv(p: RequestQuery) {
    const labels = await this.services.labels();
    const rows = (await this.filtered(p).getMany()).map((x) => this.shape(x, labels));
    const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
      ['Reference', (r) => r.publicRef],
      ['Received (UTC)', (r) => new Date(r.createdAt).toISOString()],
      ['Status', (r) => r.statusLabel],
      ['Name', (r) => r.name],
      ['Phone', (r) => r.phone],
      ['Email', (r) => r.email],
      ['Project type', (r) => r.projectTypeLabel],
      ['Area', (r) => r.area],
      ['Location', (r) => r.location],
      ['Timeline', (r) => r.timeline],
      ['Details', (r) => r.details],
      ['Notes', (r) => r.notes],
    ];
    return [cols.map(([c]) => csvSafe(c)).join(','), ...rows.map((r) => cols.map(([, f]) => csvSafe(f(r))).join(','))].join('\r\n');
  }
}
