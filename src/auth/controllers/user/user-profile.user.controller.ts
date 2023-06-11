import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrefixType } from 'common';
import {
  AuthenticateUser,
  CurrentUser,
} from '../../../common/decorators/auth.decorator';
import { SearchProfileUserReqDto } from '../../dtos/user/req/user-profile.req.dto';
import { User } from '../../entities/user.entity';
import { UserProfileUserService } from '../../services/user/user-profile.user.service';

@Controller(`${PrefixType.USER}/user-profile`)
@AuthenticateUser()
@ApiTags('User profile')
export class UserProfileUserController {
  constructor(private userProfileUserService: UserProfileUserService) {}

  @Get()
  getList(@Query() query: SearchProfileUserReqDto, @CurrentUser() user: User) {
    return this.userProfileUserService.getList(query, user);
  }
}
