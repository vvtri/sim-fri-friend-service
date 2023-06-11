import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { FriendRequestStatus } from 'shared';
import { Brackets, DataSource } from 'typeorm';
import { FriendRequest } from '../entities/friend-request.entity';

@Injectable()
export class FriendRequestRepository extends BaseRepository<FriendRequest> {
  constructor(dataSource: DataSource) {
    super(FriendRequest, dataSource);
  }

  async countMutualFriend(user1Id: number, user2Id: number) {
    let count = 0;

    const friends = await this.createQueryBuilder('fr')
      .where('fr.status = :status', { status: FriendRequestStatus.ACCEPTED })
      .andWhere(
        new Brackets((qb2) => {
          qb2
            .where('fr.beRequestedId = :user1Id')
            .orWhere('fr.beRequestedId = :user2Id')
            .orWhere('fr.requesterId = :user1Id')
            .orWhere('fr.requesterId = :user2Id');
        }),
      )
      .select('fr.requesterId')
      .addSelect('fr.beRequestedId')
      .setParameters({ user1Id, user2Id })
      .getMany();

    const user1Friends: Set<number> = new Set();
    const user2Friends: Set<number> = new Set();

    for (const friend of friends) {
      if (friend.requesterId === user1Id && friend.beRequestedId !== user2Id) {
        user1Friends.add(friend.beRequestedId);
        if (user2Friends.has(friend.beRequestedId)) count += 1;
      } else if (
        friend.beRequestedId === user1Id &&
        friend.requesterId !== user2Id
      ) {
        user1Friends.add(friend.requesterId);
        if (user2Friends.has(friend.requesterId)) count += 1;
      } else if (
        friend.requesterId === user2Id &&
        friend.beRequestedId !== user1Id
      ) {
        user2Friends.add(friend.beRequestedId);
        if (user1Friends.has(friend.beRequestedId)) count += 1;
      } else if (
        friend.beRequestedId === user2Id &&
        friend.requesterId !== user1Id
      ) {
        user2Friends.add(friend.requesterId);
        if (user1Friends.has(friend.requesterId)) count += 1;
      }
    }

    return count;
  }

  async isFriend(user1Id: number, user2Id: number) {
    return await this.exist({
      where: [
        {
          requesterId: user1Id,
          beRequestedId: user2Id,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          requesterId: user2Id,
          beRequestedId: user1Id,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });
  }

  async getMutualFriendIds(user1Id: number, user2Id: number) {
    const friends = await this.createQueryBuilder('fr')
      .where('fr.status = :status', { status: FriendRequestStatus.ACCEPTED })
      .andWhere(
        new Brackets((qb2) => {
          qb2
            .where('fr.beRequestedId = :user1Id')
            .orWhere('fr.beRequestedId = :user2Id')
            .orWhere('fr.requesterId = :user1Id')
            .orWhere('fr.requesterId = :user2Id');
        }),
      )
      .select('fr.requesterId')
      .addSelect('fr.beRequestedId')
      .setParameters({ user1Id, user2Id })
      .getMany();

    const user1Friends: Set<number> = new Set();
    const user2Friends: Set<number> = new Set();
    const mutualFriendIds: number[] = [];

    for (const friend of friends) {
      if (friend.requesterId === user1Id && friend.beRequestedId !== user2Id) {
        user1Friends.add(friend.beRequestedId);
        if (user2Friends.has(friend.beRequestedId))
          mutualFriendIds.push(friend.beRequestedId);
      } else if (
        friend.beRequestedId === user1Id &&
        friend.requesterId !== user2Id
      ) {
        user1Friends.add(friend.requesterId);
        if (user2Friends.has(friend.requesterId))
          mutualFriendIds.push(friend.requesterId);
      } else if (
        friend.requesterId === user2Id &&
        friend.beRequestedId !== user1Id
      ) {
        user2Friends.add(friend.beRequestedId);
        if (user1Friends.has(friend.beRequestedId))
          mutualFriendIds.push(friend.beRequestedId);
      } else if (
        friend.beRequestedId === user2Id &&
        friend.requesterId !== user1Id
      ) {
        user2Friends.add(friend.requesterId);
        if (user1Friends.has(friend.requesterId))
          mutualFriendIds.push(friend.requesterId);
      }
    }

    return mutualFriendIds;
  }
}
