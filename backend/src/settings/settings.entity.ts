import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Singleton (id = 1): business details, page copy, design flags and form switches. */
@Entity('settings')
export class Settings {
  @PrimaryColumn()
  id: number;

  @Column({ default: 'Rhodes Landscaping' })
  businessName: string;

  /** Owner named on the About page ("Meet Easton Rhodes.") */
  @Column({ default: '' })
  contactName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine1: string | null;

  /** City, state, ZIP */
  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  /** Hero eyebrow location, e.g. "Anaheim, California" */
  @Column({ default: '' })
  locationLabel: string;

  /** Footer line under the wordmark */
  @Column({ default: '' })
  tagline: string;

  /** About page lead paragraph (serif) */
  @Column({ type: 'text', default: '' })
  aboutLead: string;

  /** "Meet …" paragraphs (blank line = new paragraph) */
  @Column({ type: 'text', default: '' })
  aboutBody: string;

  /** Approved privacy policy. Empty = "being finalized" note. */
  @Column({ type: 'text', default: '' })
  privacyPolicy: string;

  /** Design heroStyle: fullbleed | split */
  @Column({ default: 'fullbleed' })
  heroStyle: string;

  /** Design reviewNotes: dashed "Draft — confirm with …" tags. Turn off for launch. */
  @Column({ default: true })
  showReviewNotes: boolean;

  /** Accept estimate requests online (off = the form is replaced by email/phone details). */
  @Column({ default: true })
  estimatesOpen: boolean;

  /** Allow inspiration photographs on the estimate form. */
  @Column({ default: true })
  photoUploadsOpen: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
