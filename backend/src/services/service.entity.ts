import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A landscaping service. Published services drive the home features, the Services page
 * sections and chips, the footer, the gallery filters and the estimate form's "Project type".
 */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  /** Anchor, filter and form value (garden-design, lawn-care, …) — fixed after creation. */
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  name: string;

  /** One sentence on the home page */
  @Column({ type: 'text', default: '' })
  summary: string;

  /** Services page paragraph */
  @Column({ type: 'text', default: '' })
  description: string;

  /** Three short outcomes (diamond bullet list) */
  @Column({ type: 'simple-json' })
  benefits: string[];

  /** "What this may include" accordion items */
  @Column({ type: 'simple-json' })
  includes: string[];

  /** e.g. "Request a Garden Design Estimate" (empty = "Request an Estimate") */
  @Column({ default: '' })
  ctaLabel: string;

  /** Services page main photo */
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  /** Home page feature photo (falls back to the main photo) */
  @Column({ type: 'varchar', nullable: true })
  homeImage: string | null;

  /** Optional detail photos used by some section layouts */
  @Column({ type: 'varchar', nullable: true })
  detailImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  detailImage2: string | null;

  @Column({ default: '' })
  imageAlt: string;

  /** Photo brief shown on the placeholder until a photo is uploaded */
  @Column({ default: '' })
  imageBrief: string;

  @Column({ default: true })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
