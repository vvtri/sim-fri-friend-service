import { FriendRequestStatus } from 'shared';
import { UserResDto } from '../../../../../auth/dtos/common/res/user.res.dto';
import { FriendRequest } from '../../../../entities/friend-request.entity';

export interface FriendRequestResDtoParams {
  data?: FriendRequest;
}

export class FriendRequestResDto {
  id: number;
  status: FriendRequestStatus;
  requesterId: number;
  requester: UserResDto;
  beRequestedId: number;
  beRequested: UserResDto;

  static mapProperty(
    dto: FriendRequestResDto,
    { data }: FriendRequestResDtoParams,
  ) {
    dto.id = data.id;
    dto.requesterId = data.requesterId;
    dto.beRequestedId = data.beRequestedId;
    dto.status = data.status;
  }

  static forUser(params: FriendRequestResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new FriendRequestResDto();

    this.mapProperty(result, params);

    result.requester = UserResDto.forUser({ data: data.requester });
    result.beRequested = UserResDto.forUser({ data: data.beRequested });

    return result;
  }
}
