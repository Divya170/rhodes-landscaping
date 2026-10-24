import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StatusEvent } from './status-event.entity';
import { STATUS_LABELS, RequestStatus } from './forms';

export type RecordType = 'estimate';

/** Writes and reads `status_events`. */
@Injectable()
export class HistoryService {
  constructor(@InjectRepository(StatusEvent) private readonly repo: Repository<StatusEvent>) {}

  record(type: RecordType, id: number, status: string, by: string, m?: EntityManager) {
    const r = m ? m.getRepository(StatusEvent) : this.repo;
    return r.save(r.create({ recordType: type, recordId: id, status, changedBy: by }));
  }

  async list(type: RecordType, id: number) {
    const rows = await this.repo.find({ where: { recordType: type, recordId: id }, order: { createdAt: 'ASC', id: 'ASC' } });
    return rows.map((e) => ({ status: e.status, label: STATUS_LABELS[e.status as RequestStatus] || e.status, by: e.changedBy, at: e.createdAt }));
  }

  remove(type: RecordType, id: number) {
    return this.repo.delete({ recordType: type, recordId: id });
  }
}
