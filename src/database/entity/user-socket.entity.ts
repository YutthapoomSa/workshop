import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { UserDB } from './user.entity';

@Table({
    tableName: 'user_socket',
})
export class UserSocketDB extends Model<UserSocketDB> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: 'unique_user_socket',
        primaryKey: true,
    })
    id: number;

    @Column
    refreshToken: string;

    @CreatedAt
    readonly createdAt?: Date;

    @UpdatedAt
    readonly updatedAt?: Date;
    // ────────────────────────────────────────────────────────────────────────────────

    @ForeignKey(() => UserDB)
    @Column({
        allowNull: true,
    })
    userId: number;

    @BelongsTo(() => UserDB)
    user: UserDB;
}
