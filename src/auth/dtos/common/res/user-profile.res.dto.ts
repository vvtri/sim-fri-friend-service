import { UserProfileRelationshipStatus } from 'shared';
import { UserResDto } from '../../../../auth/dtos/common/res/user.res.dto';
import { FileResDto } from '../../../../file/dtos/common/file.res.dto';
import { UserProfile } from '../../../entities/user-profile.entity';

export interface UserProfileResDtoParams {
  data?: UserProfile;
  mutualFriendCount?: number;
}

export class UserProfileResDto {
  id: number;
  address: string;
  name: string;
  birthDate: Date;
  workplace: string;
  school: string;
  hometown: string;
  relationshipStatus: UserProfileRelationshipStatus;
  avatar: FileResDto;
  user: UserResDto;
  mutualFriendCount: number;

  static mapProperty(
    dto: UserProfileResDto,
    { data, mutualFriendCount }: UserProfileResDtoParams,
  ) {
    dto.id = data.id;
    dto.address = data.address;
    dto.name = data.name;
    dto.birthDate = data.birthDate;
    dto.workplace = data.workplace;
    dto.school = data.school;
    dto.hometown = data.hometown;
    dto.relationshipStatus = data.relationshipStatus;
    dto.mutualFriendCount = mutualFriendCount;
  }

  static forUser(params: UserProfileResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new UserProfileResDto();

    this.mapProperty(result, params);

    result.avatar = FileResDto.forUser({ data: data.avatar });
    result.user = UserResDto.forUser({ data: data.user });

    return result;
  }
}
