import { User } from '../../../entities/user.entity';
import { UserProfileResDto } from './user-profile.res.dto';

export interface UserResDtoParams {
  data?: User;
  mutualFriends?: User[];
}

export class UserResDto {
  id: number;
  phoneNumber: string;
  email: string;
  createdAt: Date;
  profile: UserProfileResDto;
  mutualFriends: UserResDto[];

  static mapProperty(dto: UserResDto, { data }: UserResDtoParams) {
    dto.id = data.id;
    dto.phoneNumber = data.phoneNumber;
    dto.email = data.email;
    dto.createdAt = data.createdAt;
  }

  static forUser(params: UserResDtoParams) {
    const { data, mutualFriends } = params;

    if (!data) return null;
    const result = new UserResDto();

    this.mapProperty(result, params);

    result.profile = UserProfileResDto.forUser({ data: data.userProfile });
    result.mutualFriends = mutualFriends?.map((item) =>
      UserResDto.forUser({ data: item }),
    );

    return result;
  }
}
