import { NewsDB } from './../../database/entity/news.entity';
/*
https://docs.nestjs.com/providers#services
*/

import { forwardRef, HttpException, HttpStatus, Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { DataBase } from 'src/database/database.providers';
import { LogService } from 'src/helper/services/log.service';
import { NewsService } from './news.service';

@Injectable()
export class ApiNewsService implements OnApplicationBootstrap {
    private logger = new LogService(ApiNewsService.name);

    constructor(
        @Inject(DataBase.NewsDB) private newsRepository: typeof NewsDB,
        @Inject('SEQUELIZE') private sequelize: Sequelize,


        @Inject(forwardRef(() => NewsService))
        private newsService: NewsService,
    ) {}
    onApplicationBootstrap() {
        //
    }

    async api_findOne(id: number) {
        const tag = this.api_findOne.name;
        try {
            // const findOne = await this.newsService.findOne(id);
            return await this.newsService.findOne(id);
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
