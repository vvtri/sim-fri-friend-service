import { IsValidEnum, IsValidNumber, IsValidText } from 'common';
import { FriendRequestStatus } from 'shared';
import { PaginationReqDto } from '../../../../common/dtos/pagination.dto';

export enum ReplyFriendRequestAction {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class GetListFriendRequestUserReqDto extends PaginationReqDto {
  @IsValidText({ required: false })
  searchText?: string;

  @IsValidNumber({ required: false, min: 1 })
  userId?: number;

  @IsValidEnum({ enum: FriendRequestStatus, required: false })
  status?: FriendRequestStatus;
}

export class ReplyFriendRequestUserReqDto {
  @IsValidNumber({ min: 1 })
  friendRequestId: number;

  @IsValidEnum({ enum: ReplyFriendRequestAction })
  action: ReplyFriendRequestAction;
}
