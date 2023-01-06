import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { UserDB } from './user.entity';

@Table({
    tableName: 'user_token',
})
export class UserTokenDB extends Model<UserTokenDB> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: 'unique_user_token',
        primaryKey: true,
    })
    id: number;

    @Column
    accessToken: string;

    @Column
    refreshToken: string;

    @Column({
        comment: 'วันหมดอายุ Token',
    })
    expire: string;

    // ────────────────────────────────────────────────────────────────────────────────

    @ForeignKey(() => UserDB)
    @Column({
        allowNull: true,
    })
    userId: number;

    @BelongsTo(() => UserDB)
    user: UserDB;
}
