import { HttpException, HttpStatus, Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { DataBase } from 'src/database/database.providers';
import { LogService } from 'src/helper/services/log.service';
import { NewsDB } from '../../database/entity/news.entity';

@Injectable()
export class NewsService implements OnApplicationBootstrap {
  private logger = new LogService(NewsService.name);

  constructor(
    @Inject(DataBase.NewsDB) private readonly newsRepository: typeof NewsDB,
    @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
  ) {
  }
  onApplicationBootstrap() {
    // test
  }

  async findOne(id: number) {
    const tag = this.findOne.name;
    try {
      const news = await this.newsRepository.findByPk(id);
      return news;
    } catch (error) {
      this.logger.error(`${tag} -> `, error);
      throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
