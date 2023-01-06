import { ApiProperty } from '@nestjs/swagger';
import { Model } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';

@Table({
    tableName: 'news',
    comment:'ตารางข่าว new'
})
export class NewsDB extends Model<NewsDB> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: 'unique_news_id',
        primaryKey: true,
    })
    id: number;

    @Column({
        allowNull: false,
        comment: 'หัวข้อข่าว'
    })
    headlines: string;

    @Column({
        allowNull: false,
    })
    details: string;

    @Column({
        allowNull: false,
    })
    img: string;
}