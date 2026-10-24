import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Table `status_events` : the status history of estimate requests. */
@Entity('status_events')
@Index(['recordType', 'recordId'])
export class StatusEvent {
  @PrimaryGeneratedColumn()
  id: number;

  /** "estimate" */
  @Column({ name: 'record_type' })
  recordType: string;

  @Column({ name: 'record_id' })
  recordId: number;

  @Column()
  status: string;

  /** Admin email, or "website" for the initial New event */
  @Column({ name: 'changed_by' })
  changedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
