import { Injectable } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Brackets } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UserProfileResDto } from '../../dtos/common/res/user-profile.res.dto';
import { SearchProfileUserReqDto } from '../../dtos/user/req/user-profile.req.dto';
import { User } from '../../entities/user.entity';
import { UserProfileRepository } from '../../repositories/user-profile.repository';

@Injectable()
export class UserProfileUserService {
  constructor(private userProfileRepo: UserProfileRepository) {}

  @Transactional()
  async getList(dto: SearchProfileUserReqDto, user: User) {
    const { limit, page } = dto;
    let { searchText } = dto;

    const qb = this.userProfileRepo
      .createQueryBuilder('up')
      .groupBy('up.id')
      .select('up.id')
      .orderBy('up.id', 'DESC');

    if (searchText) {
      searchText = `%${searchText}%`;

      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('up.name ilike :searchText')
            .orWhere('up.address ilike :searchText')
            .orWhere('up.name ilike :searchText')
            .orWhere('up.workplace ilike :searchText')
            .orWhere('up.school ilike :searchText')
            .orWhere('up.hometown ilike :searchText', { searchText });
        }),
      );
    }

    const { items, meta } = await paginate(qb, { limit, page });

    const userProfiles = await Promise.all(
      items.map(async (item) => {
        const userProfile = await this.userProfileRepo.findOne({
          where: { id: item.id },
          relations: { avatar: true, user: true },
        });

        return UserProfileResDto.forUser({ data: userProfile });
      }),
    );

    return new Pagination(userProfiles, meta);
  }
}
