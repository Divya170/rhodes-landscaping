import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * One polymorphic table for every simple CMS collection on the site
 * (booking steps, maintenance topics, warning signs, schedule sources, gallery, page photos). `type` is the discriminator;
 * `fields` holds the type-specific values validated against content.schemas.ts.
 */
@Entity('content_blocks')
@Index(['type', 'sortOrder'])
export class ContentBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'simple-json' })
  fields: Record<string, unknown>;

  /** Only published rows appear on the site. */
  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
