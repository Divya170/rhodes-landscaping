import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { ProjectsService } from './projects.service';
import { SessionGuard } from '../common/session';

class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  /** GET /api/projects?category=<service slug> — published only (Handoff) */
  @Get('projects')
  list(@Query('category') category?: string) {
    return this.projects.listPublished(category);
  }

  @Get('admin/projects')
  @UseGuards(SessionGuard)
  adminList(@Query('q') q?: string, @Query('category') category?: string, @Query('status') status?: string) {
    return this.projects.adminList({ q, category, status });
  }

  @Post('admin/projects/reorder')
  @UseGuards(SessionGuard)
  reorder(@Body() dto: ReorderDto) {
    return this.projects.reorder(dto.ids);
  }

  // Bodies are validated by validateProject() (field-level messages).
  @Post('admin/projects')
  @UseGuards(SessionGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.projects.create(body);
  }

  @Patch('admin/projects/:id')
  @UseGuards(SessionGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.projects.update(id, body);
  }

  @Delete('admin/projects/:id')
  @UseGuards(SessionGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projects.remove(id);
  }
}
