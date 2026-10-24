import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf, Validate } from 'class-validator';
import { phoneOk } from '../common/forms';

class PhoneRule {
  validate(v: unknown) {
    return typeof v === 'string' && phoneOk(v);
  }
  defaultMessage() {
    return 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.';
  }
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Enter the business name.' }) @MaxLength(120) businessName?: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.phone !== null && o.phone !== '') @Validate(PhoneRule) phone?: string | null;
  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Enter an email address in the format name@example.com.' })
  email?: string | null;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine1 !== null) @IsString() @MaxLength(160) addressLine1?: string | null;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine2 !== null) @IsString() @MaxLength(160) addressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(60) locationLabel?: string;
  @IsOptional() @IsString() @MaxLength(200) tagline?: string;
  @IsOptional() @IsString() @MaxLength(600, { message: 'Keep the lead paragraph under 600 characters.' }) aboutLead?: string;
  @IsOptional() @IsString() @MaxLength(3000, { message: 'Keep this under 3,000 characters.' }) aboutBody?: string;
  @IsOptional() @IsString() @MaxLength(20000) privacyPolicy?: string;
  @IsOptional() @IsIn(['fullbleed', 'split'], { message: 'Choose a hero layout.' }) heroStyle?: string;
  @IsOptional() @IsBoolean() showReviewNotes?: boolean;
  @IsOptional() @IsBoolean() estimatesOpen?: boolean;
  @IsOptional() @IsBoolean() photoUploadsOpen?: boolean;
}
