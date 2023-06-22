import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrefixType } from 'common';
import {
  AuthenticateUser,
  CurrentUser,
} from '../../../common/decorators/auth.decorator';
import { SearchProfileUserReqDto } from '../../dtos/user/req/user..req.dto';
import { User } from '../../entities/user.entity';
import { UserUserService } from '../../services/user/user.user.service';

@Controller(`${PrefixType.USER}/user`)
@AuthenticateUser()
@ApiTags('User')
export class UserUserController {
  constructor(private userUserService: UserUserService) {}

  @Get()
  getList(@Query() query: SearchProfileUserReqDto, @CurrentUser() user: User) {
    return this.userUserService.getList(query, user);
  }
}
