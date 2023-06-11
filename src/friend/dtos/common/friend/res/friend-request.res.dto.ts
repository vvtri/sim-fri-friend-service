import { FriendRequestStatus } from 'shared';
import { UserResDto } from '../../../../../auth/dtos/common/res/user.res.dto';
import { User } from '../../../../../auth/entities/user.entity';
import { FriendRequest } from '../../../../entities/friend-request.entity';

export interface FriendRequestResDtoParams {
  data?: FriendRequest;
  mutualFriends?: User[];
  isFriend?: boolean;
}

export class FriendRequestResDto {
  id: number;
  status: FriendRequestStatus;
  requesterId: number;
  requester: UserResDto;
  beRequestedId: number;
  beRequested: UserResDto;
  mutualFriends: UserResDto[];
  isFriend: boolean;

  static mapProperty(
    dto: FriendRequestResDto,
    { data, isFriend }: FriendRequestResDtoParams,
  ) {
    dto.id = data.id;
    dto.requesterId = data.requesterId;
    dto.beRequestedId = data.beRequestedId;
    dto.status = data.status;
    dto.isFriend = isFriend;
  }

  static forUser(params: FriendRequestResDtoParams) {
    const { data, mutualFriends } = params;

    if (!data) return null;
    const result = new FriendRequestResDto();

    this.mapProperty(result, params);

    result.requester = UserResDto.forUser({ data: data.requester });
    result.beRequested = UserResDto.forUser({ data: data.beRequested });
    result.mutualFriends = mutualFriends?.map((item) =>
      UserResDto.forUser({ data: item }),
    );

    return result;
  }
}
