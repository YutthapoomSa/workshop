import {
    CACHE_MANAGER,
    forwardRef,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    OnApplicationBootstrap,
    UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import bcrypt from 'bcrypt';
import jwt_decode from 'jwt-decode';
import { Cache } from 'cache-manager';
import { sign } from 'jsonwebtoken';
import moment from 'moment';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { DataBase } from 'src/database/database.providers';
import { v4 as uuidv4 } from 'uuid';
import { UserTokenDB } from '../../../database/entity/user-token.entity';
import { UserDB, UserDBRole } from '../../../database/entity/user.entity';
import { ConvertImageService } from '../../../helper/services/convert-image.service';
import { EncryptionService } from '../../../helper/services/encryption.service';
import { LogService } from '../../../helper/services/log.service';
import { ConfigService } from '../../../shared/config/config.service';
import { JwtPayload } from '../auth/jwt-payload.model';
import { FindOneUserResDTO } from '../dto/find-one-user-res.dto';
import { UserNameCheckResDTO } from '../dto/user-check.dto';
import { UserLoginRefreshToKenReqDto } from '../dto/user-login-refreshToken.dto';
import { UserLoginRequestDTO } from '../dto/user-login.dto';
import { ResStatus } from './../../../shared/enum/res-status.enum';
import { CreateUserReqDTO } from './../dto/create-user-req.dto';
import { CacheUsersService } from './cache-users.service';
import jwtDecode from 'jwt-decode';
@Injectable()
export class UsersService implements OnApplicationBootstrap {
    private readonly jwtPrivateKey: string;
    private logger = new LogService(UsersService.name);

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(DataBase.UserDB) private readonly usersRepository: typeof UserDB,
        @Inject(DataBase.UserTokenDB) private readonly userTokenRepository: typeof UserTokenDB,
        @Inject(DataBase.UserDB) private readonly userRepository: typeof UserDB,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,

        private readonly configService: ConfigService,
        private encryptionService: EncryptionService,
        private convertImageService: ConvertImageService,

        @Inject(forwardRef(() => CacheUsersService))
        private cacheUsersService: CacheUsersService,
    ) {
        this.jwtPrivateKey = this.configService.jwtConfig.privateKey;
    }
    onApplicationBootstrap() {
        this.initSuperAdmin();
    }

    // [function]─────────────────────────────────────────────────────────────────

    async findOne(id: number): Promise<UserDB> {
        const tag = this.findOne.name;
        try {
            const resultGetCache = await this.cacheUsersService.getCacheUser(id);
            if (resultGetCache) return resultGetCache;

            const user = await this.usersRepository.findByPk<UserDB>(id);
            if (!user) throw new HttpException('User with given id not found', HttpStatus.NOT_FOUND);

            user.image = this.convertImageService.getLinkImage(user.image);

            await this.cacheUsersService.setCacheUser(user);

            return user;
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async isEmail(_email: string): Promise<boolean> {
        const tag = this.isEmail.name;
        try {
            const findEmail = await this.usersRepository.findOne({
                where: {
                    email: _email,
                },
            });
            return findEmail ? true : false;
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async genPassword(password: string) {
        const tag = this.genPassword.name;
        try {
            const _salt = await bcrypt.genSalt(10);
            const _hashPass = await bcrypt.hash(password, _salt);

            return {
                salt: _salt,
                hashPass: _hashPass,
            };
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(body: UserLoginRequestDTO) {
        const tag = this.login.name;
        try {
            const res = {
                resCode: ResStatus.success,
                resData: {},
                msg: '',
            };

            const user = await this.usersRepository.findOne({
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                where: {
                    username: body.username,
                },
            });

            if (!user) {
                throw new HttpException('Invalid username or email or password.', HttpStatus.BAD_REQUEST);
            }

            const _isMatch = await bcrypt.compare(body.password, user.password);

            if (!_isMatch) {
                throw new HttpException('Invalid email or password.', HttpStatus.BAD_REQUEST);
            }

            // genToken
            const _accessToken = await this.signToken(user, '1h');
            const _refreshToken = await this.signToken(user, '1d');
            let _expire = moment().add(1, 'd');
            _expire = _expire.add(5, 'm');

            // ─────────────────────────────────────────────────────────────────
            // add token to DB for verify
            const tokenDB = new UserTokenDB();
            tokenDB.accessToken = _accessToken.jit;
            tokenDB.refreshToken = _refreshToken.jit;
            tokenDB.expire = _expire.toISOString();
            tokenDB.userId = user.id;
            await tokenDB.save();

            user.image = this.convertImageService.getLinkImage(user.image);

            const _user = user.toJSON();
            delete _user.password;

            res.resData = _user;

            res.resData = Object.assign(res.resData, { accessToken: _accessToken.token });
            res.resData = Object.assign(res.resData, { refreshToken: _refreshToken.token });
            res.resData = Object.assign(res.resData, { expire: _expire });
            return res;
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async refreshToken(user: UserDB, body: UserLoginRefreshToKenReqDto) {
        const tag = this.refreshToken.name;
        try {
            this.logger.debug(`${tag} -> body : `, body);

            // ────────────────────────────────────────────────────────────────────────────────
            const decodedAccessToken: JwtPayload = jwt_decode(body.accessToken);
            this.logger.debug(`${tag} -> decodedAccessToken : `, decodedAccessToken);
            // console.log(decoded);
            const decodedAccessToken2 = this.encryptionService.decode(decodedAccessToken.jit);
            this.logger.debug(`${tag} -> decodedAccessToken2 : `, decodedAccessToken2);

            // ────────────────────────────────────────────────────────────────────────────────
            const decodedRefreshToken: JwtPayload = jwt_decode(body.refreshToken);
            this.logger.debug(`${tag} -> decodedRefreshToken : `, decodedRefreshToken);
            // console.log(decoded);
            const decodedRefreshToken2 = this.encryptionService.decode(decodedRefreshToken.jit);
            this.logger.debug(`${tag} -> decodedRefreshToken2 : `, decodedRefreshToken2);

            // ────────────────────────────────────────────────────────────────────────────────

            const res = {
                resCode: ResStatus.success,
                resData: {},
                msg: '',
            };

            const result = await this.userTokenRepository.findOne({
                where: {
                    userId: user.id,
                    refreshToken: decodedRefreshToken2,
                    accessToken: decodedAccessToken2,
                },
            });

            if (!result) {
                const value = await this.cacheManager.get(`a_token${decodedAccessToken2}`);
                if (value) {
                    await this.cacheManager.del(`a_token${decodedAccessToken2}`);
                    throw new HttpException('Invalid refresh token.', HttpStatus.UNAUTHORIZED);
                } else {
                    throw new HttpException('Invalid test1.', HttpStatus.BAD_REQUEST);
                }
            }

            // genToken
            const _accessToken = await this.signToken(user, '1h');
            const _refreshToken = await this.signToken(user, '1d');
            // const _expire = moment().add(1, 'd').toISOString();
            let _expire = moment().add(1, 'd');
            _expire = _expire.add(5, 'm');

            // ─────────────────────────────────────────────────────────────────
            // add token to DB for verify
            const tokenDB = new UserTokenDB();

            tokenDB.accessToken = _accessToken.jit;
            tokenDB.refreshToken = _refreshToken.jit;
            tokenDB.expire = _expire.toISOString();
            tokenDB.userId = user.id;
            await tokenDB.save();

            this.logger.debug('save');
            res.resData = Object.assign(res.resData, { accessToken: _accessToken.token });
            res.resData = Object.assign(res.resData, { refreshToken: _refreshToken.token });
            res.resData = Object.assign(res.resData, { expire: _expire });

            await result.destroy();

            return res;
        } catch (error: any) {
            this.logger.error(`${tag} -> `, error);
            // console.error(error)
            // checkErrorStatus(error)
            if (!!error && !!error.status && error.status === 401) {
                throw new UnauthorizedException();
            } else {
                throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    // ────────────────────────────────────────────────────────────────────────────────

    async verifyAccessToken(jit: string) {
        const tag = this.verifyAccessToken.name;
        try {
            const value = await this.cacheManager.get(`a_token${jit}`);
            if (value) {
                return true;
            }
            const count = await this.userTokenRepository.count({
                where: { accessToken: jit },
            });
            const isCount = count > 0;
            if (isCount) {
                await this.cacheManager.set(`a_token${jit}`, isCount, { ttl: 60 * 5 });
            }
            return isCount;
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyRefreshToken(jit: string) {
        const tag = this.verifyRefreshToken.name;
        try {
            // const value = await this.cacheManager.get(`a_token${jit}`);
            // if (value) return true;

            const count = await this.userTokenRepository.count({
                where: { refreshToken: jit },
            });
            const isCount = count > 0;
            if (isCount) {
                // await this.cacheManager.set(`a_token${jit}`, isCount, { ttl: 10 });
            }
            return isCount;
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async checkUserName(_username: string) {
        const count = await this.usersRepository.count({
            where: {
                username: _username,
            },
        });
        return new UserNameCheckResDTO(count > 0);
    }

    private async initSuperAdmin() {
        const tag = this.initSuperAdmin.name;
        try {
            const result = await this.usersRepository.findOne({
                where: { username: 'superAdmin' },
            });
            if (!result) {
                // const createUserReqDto = new CreateUserReqDTO();
                // createUserReqDto.email = 'superAdmin@gmail.com';
                // createUserReqDto.username = 'superAdmin';
                // createUserReqDto.firstName = 'superAdmin';
                // createUserReqDto.lastName = 'superAdmin';
                // createUserReqDto.password = 'superAdmin';
                // createUserReqDto.role = UserDBRole.superAdmin;
                // this.create(createUserReqDto);
            }
        } catch (error) {
            this.logger.error(`${tag} -> `, error);
            throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async signToken(user: UserDB, expires?: string) {
        const _jit = uuidv4();
        const enDeCodeId = this.encryptionService.encode(user.id.toString());
        const enDeCodeJit = this.encryptionService.encode(_jit);
        const enDeCodeRole = this.encryptionService.encode(user.role);
        const payload: JwtPayload = {
            id: enDeCodeId,
            role: enDeCodeRole,
            jit: enDeCodeJit,
        };
        const _expires = expires || '1y';
        return {
            token: sign(payload, this.jwtPrivateKey, { expiresIn: _expires }),
            jit: _jit,
        };
    }

    async getAllUserId(): Promise<number[]> {
        return new Promise(async (resolve, reject) => {
            const result = await this.usersRepository.findAll({ attributes: ['id'] });
            return resolve(result.map((x) => x.id));
        });
    }

    // [Cron]─────────────────────────────────────────────────────────────────

    @Cron(CronExpression.EVERY_DAY_AT_11PM)
    cronLoginToken() {
        this.logger.debug(`cron -> EVERY_DAY_AT_11PM`);
        const _moment = moment().toISOString();
        this.userTokenRepository.destroy({
            where: {
                expire: {
                    [Op.lte]: _moment,
                },
            },
        });
    }
}
