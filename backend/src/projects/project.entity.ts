import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Project gallery entry (Handoff project model). Only published rows are public. */
@Entity('projects')
@Index(['published', 'sortOrder'])
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  /** Service slug (garden-design, lawn-care, planting, outdoor-improvements) */
  @Column()
  category: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Main photograph (/uploads/… or https://…). Empty = labelled placeholder. */
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  /** Photo brief shown on the placeholder until a photograph is added */
  @Column({ default: '' })
  imageBrief: string;

  /** Gallery tile shape: 4/5, 3/2, 1/1 or 5/4 */
  @Column({ default: '4/5' })
  ratio: string;

  /** Verified location only (Handoff) */
  @Column({ default: '' })
  location: string;

  /** Optional genuine before/after pair — the comparison slider shows only when both are set. */
  @Column({ type: 'varchar', nullable: true })
  beforeImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  afterImage: string | null;

  /** Shown in the home "Spaces worth stepping into" band (first three) */
  @Column({ default: false })
  featured: boolean;

  /** Design "Illustrative concept" label — not completed Rhodes work */
  @Column({ default: false })
  illustrative: boolean;

  @Column({ default: true })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
