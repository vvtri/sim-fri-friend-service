import { Injectable } from '@nestjs/common';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Brackets, In } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { FriendRequestRepository } from '../../../friend/repositories/friend-request.repository';
import { UserResDto } from '../../dtos/common/res/user.res.dto';
import { SearchProfileUserReqDto } from '../../dtos/user/req/user-profile.req.dto';
import { User } from '../../entities/user.entity';
import { UserProfileRepository } from '../../repositories/user-profile.repository';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class UserUserService {
  constructor(
    private userProfileRepo: UserProfileRepository,
    private friendRequestRepo: FriendRequestRepository,
    private userRepo: UserRepository,
  ) {}

  @Transactional()
  async getList(dto: SearchProfileUserReqDto, user: User) {
    const { limit, page } = dto;
    let { searchText } = dto;

    let friendIds = await this.friendRequestRepo.getFriendIds(user.id);
    friendIds = friendIds.slice(0, 6);

    const qb = this.userRepo
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.userProfile', 'up')
      .groupBy('u.id')
      .select('u.id')
      .where('u.id != :myUserId', { myUserId: user.id });

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

    if (friendIds.length) {
      qb.orderBy(
        `case when u.id IN (:...friendIds) then 1 else 0 end`,
      ).setParameter('friendIds', friendIds);
    }

    qb.addOrderBy('u.id', 'DESC');

    const { items, meta } = await paginate(qb, { limit, page });

    const users = await Promise.all(
      items.map(async (item) => {
        const userRes = await this.userRepo.findOne({
          where: { id: item.id },
          relations: { userProfile: { avatar: true } },
        });

        const mutualFriendIds = await this.friendRequestRepo.getMutualFriendIds(
          item.id,
          userRes.id,
        );
        const mutualFriends = await this.userRepo.find({
          where: { id: In(mutualFriendIds) },
          relations: { userProfile: { avatar: true } },
        });
        const friendRequest = await this.friendRequestRepo.findOneBy([
          { beRequestedId: user.id, requesterId: item.id },
          { requesterId: user.id, beRequestedId: item.id },
        ]);

        return UserResDto.forUser({
          data: userRes,
          mutualFriends,
          friendRequest,
        });
      }),
    );

    return new Pagination(users, meta);
  }
}
