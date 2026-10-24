import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { RequestStatus } from '../common/forms';

/** An estimate request (lead) from the Contact page. Handoff: POST /api/estimate-requests. */
@Entity('estimate_requests')
@Index(['status'])
@Index(['createdAt'])
@Index(['email'])
export class EstimateRequest {
  @PrimaryGeneratedColumn()
  id: number;

  /** RL-1001 */
  @Index({ unique: true })
  @Column({ name: 'public_ref', type: 'varchar', nullable: true })
  publicRef: string | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  /** Service slug, or "other" */
  @Column({ name: 'project_type' })
  projectType: string;

  /** Optional outdoor-area chip */
  @Column({ default: '' })
  area: string;

  @Column({ type: 'varchar', length: 200 })
  location: string;

  @Column()
  timeline: string;

  @Column({ type: 'text' })
  details: string;

  @Column({ type: 'varchar', default: 'new' })
  status: RequestStatus;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true })
  idempotencyKey: string | null;

  /** disabled | pending | sent | failed — owner email */
  @Column({ name: 'notification_state', default: 'disabled' })
  notificationState: string;

  /** disabled | pending | sent | failed — customer acknowledgement */
  @Column({ name: 'acknowledgement_state', default: 'disabled' })
  acknowledgementState: string;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
