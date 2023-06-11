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
import { PaginationResponse } from '../../../common/decorators/swagger.decorator';
import { FriendRequestResDto } from '../../dtos/common/friend/res/friend-request.res.dto';
import {
  GetListFriendRequestUserReqDto,
  GetListFriendSuggestionUserReqDto,
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

  @Get(':userId/is-friend')
  isFriend(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.isFriend(userId, user);
  }

  @Get('suggestion')
  @PaginationResponse(FriendRequestResDto)
  getListSuggestion(
    @Query() query: GetListFriendSuggestionUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.getFriendSuggestion(query, user);
  }

  @Get()
  @PaginationResponse(FriendRequestResDto)
  getList(
    @Query() query: GetListFriendRequestUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.getList(query, user);
  }

  @Get(':userId')
  getFriend(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.getFriend(userId, user);
  }

  @Post('add/:userId')
  addFriend(
    @Param('userId', ParseIntPipe) userId: number,
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
  delete(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: User,
  ) {
    return this.friendRequestUserService.delete(userId, user);
  }
}
