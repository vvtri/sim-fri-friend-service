import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrefixType } from 'common';
import { User } from '../../../auth/entities/user.entity';
import {
  AuthenticateUser,
  CurrentUser,
} from '../../../common/decorators/auth.decorator';
import {
  GetListFriendRequestUserReqDto,
  ReplyFriendRequestUserReqDto,
} from '../../dtos/user/req/friend-request.user.req.dto';
import { FriendRequestUserService } from '../../services/user/friend-request.user.service';

@Controller(`${PrefixType.USER}/friend-request`)
@ApiTags('Friend request user')
@AuthenticateUser()
export class FriendRequestUserController {
  constructor(private friendRequestUserService: FriendRequestUserService) {}

  @Get(':userId/count')
  countFriend(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.countFriend(userId, user);
  }

  @Get()
  getList(
    @Query() query: GetListFriendRequestUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.getList(query, user);
  }

  @Post('add/:userId')
  addFriend(
    @Query('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.addFriend(userId, user);
  }

  @Post('reply')
  replyFriendRequest(
    @Body() body: ReplyFriendRequestUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.replyFriendRequest(body, user);
  }

  @Delete(':userId')
  unFriend(
    @Query('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.unFriend(userId, user);
  }
}
