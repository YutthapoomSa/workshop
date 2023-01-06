import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { ApiNewsService } from './api-news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService,
    private readonly apiNewsService: ApiNewsService) { }
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.apiNewsService.api_findOne(id);
  }

}
