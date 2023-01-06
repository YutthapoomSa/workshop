import { ApiProperty } from '@nestjs/swagger';
import { Model } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';

@Table({
    tableName: 'News',
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

    @ApiProperty()
    @Column({
        allowNull: false,
        comment: 'หัวข้อข่าว'
    })
    headlines: string;

    @ApiProperty()
    @Column({
        allowNull: false,
    })
    detials: string;

    @ApiProperty()
    @Column({
        allowNull: false,
    })
    img: string;
}