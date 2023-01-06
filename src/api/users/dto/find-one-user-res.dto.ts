import { ApiProperty } from '@nestjs/swagger';
import { UserDB, UserDBGender, UserDBRole } from '../../../database/entity/user.entity';
import { ResStatus } from './../../../shared/enum/res-status.enum';

class FindOneUserResDTOResData {
    @ApiProperty()
    email: string;

    @ApiProperty({
        description: 'ข้อมูล',
    })
    userName: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty({
        description: 'สิทธิ์การเข้าใช้งาน',
    })
    role: UserDBRole;

    @ApiProperty({
        description: 'status เปิด ปิด',
    })
    status: boolean;

    @ApiProperty({
        description: 'เพศ',
    })
    gender: UserDBGender;

    @ApiProperty()
    phoneNumber: string;
}

export class FindOneUserResDTO {
    @ApiProperty({
        enum: Object.keys(ResStatus).map((k) => ResStatus[k]),
        description: 'รหัสสถานะ',
    })
    resCode: ResStatus;

    @ApiProperty({
        type: () => FindOneUserResDTOResData,
        description: 'ข้อมูล',
    })
    resData: FindOneUserResDTOResData;

    @ApiProperty({
        description: 'ข้อความอธิบาย',
    })
    msg: string;

    constructor(resCode: ResStatus, msg: string, datas: UserDB) {
        this.resCode = resCode;
        this.msg = msg;
        this.resData = null;

        if (!!datas) {
            const _data = new FindOneUserResDTOResData();
            _data.email = datas.email;
            _data.userName = datas.username;
            _data.firstName = datas.firstName;
            _data.lastName = datas.lastName;
            _data.role = datas.role;
            _data.status = datas.status;
            _data.gender = datas.gender;
            _data.phoneNumber = datas.phoneNumber;
        }
    }
}
