import { IsHash } from 'class-validator';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { UserDB } from './user.entity';

@Table({
    tableName: 'user_password',
})
export class UserPasswordDB extends Model<UserPasswordDB> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: 'uq_user_pass_id',
        primaryKey: true,
    })
    id: number;

    @Column({
        allowNull: false,
        comment: 'password hash',
    })
    @IsHash('sha512')
    hashPassword: string;

    @Column({
        allowNull: false,
        defaultValue: false,
    })
    isResetProgress: boolean;

    @Column({
        allowNull: true,
        defaultValue: null,
    })
    resetCode: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
    })
    resetExpires: Date;

    @Column({
        allowNull: false,
        defaultValue: false,
    })
    activate: boolean;

    // ────────────────────────────────────────────────────────────────────────────────

    @ForeignKey(() => UserDB)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    userId: number;

    @BelongsTo(() => UserDB)
    user: UserDB;
}
