import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * An inspiration photograph from the estimate form. Uploaded first (real progress), EXIF stripped,
 * stored privately (never served publicly) and linked when the request is sent.
 * Unlinked uploads are deleted after 24 h.
 */
@Entity('estimate_images')
@Index(['requestId'])
export class EstimateImage {
  /** Random id handed to the browser (not guessable) */
  @PrimaryColumn()
  id: string;

  @Column({ name: 'request_id', type: 'integer', nullable: true })
  requestId: number | null;

  /** Original file name, sanitised, for display only */
  @Column({ name: 'original_name' })
  originalName: string;

  /** Safe generated file name in PRIVATE_UPLOAD_DIR */
  @Column({ name: 'stored_name' })
  storedName: string;

  /** Detected from the file's bytes, not the browser */
  @Column()
  mime: string;

  @Column()
  size: number;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
