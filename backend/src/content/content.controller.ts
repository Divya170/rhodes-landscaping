import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { ContentService } from './content.service';
import { SessionGuard } from '../common/session';
import { SettingsService } from '../settings/settings.service';
import { ProjectsService } from '../projects/projects.service';
import { ServicesService } from '../services/services.service';

class CreateContentDto {
  @IsString() type: string;
  @IsObject() fields: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class UpdateContentDto {
  @IsOptional() @IsObject() fields?: Record<string, unknown>;
  @IsOptional() @IsBoolean() published?: boolean;
}

class ReorderContentDto {
  @IsString() type: string;
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

@Controller()
export class SiteController {
  constructor(
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly services: ServicesService,
    private readonly projects: ProjectsService,
  ) {}

  /** Everything the public pages render, in one call. */
  @Get('site')
  async site() {
    const c = await this.content.publicBundle(['step', 'principle', 'form-option']);
    const opts = (list: string) => c['form-option'].filter((x: Row) => x.list === list).map((x: Row) => str(x.label));
    return {
      settings: await this.settings.getPublic(),
      services: await this.services.listPublished(),
      projects: await this.projects.listPublished(),
      steps: c.step.map((x: Row) => ({ id: Number(x.id), title: str(x.title), text: str(x.text) })),
      principles: c.principle.map((x: Row) => ({ id: Number(x.id), title: str(x.title), text: str(x.text) })),
      options: { area: opts('area'), timeline: opts('timeline') },
      images: await this.content.siteImages(),
    };
  }
}

@Controller('admin/content')
@UseGuards(SessionGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('types')
  types() {
    return this.content.types();
  }

  @Get('counts')
  counts() {
    return this.content.counts();
  }

  @Get()
  adminList(@Query('type') type: string) {
    return this.content.adminList(type);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderContentDto) {
    return this.content.reorder(dto.type, dto.ids);
  }

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentDto) {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.content.remove(id);
  }
}
