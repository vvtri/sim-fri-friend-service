import { Injectable } from '@nestjs/common';
import { KafkaProducer } from '@vvtri/nestjs-kafka';
import {
  ExpectationFailedExc,
  FriendRequestCreatedKafkaPayload,
  FriendRequestDeletedKafkaPayload,
  FriendRequestUpdatedKafkaPayload,
  KAFKA_TOPIC,
} from 'common';
import { paginate } from 'nestjs-typeorm-paginate';
import { Pagination } from 'nestjs-typeorm-paginate/dist/pagination';
import { FriendRequestStatus } from 'shared';
import { Brackets, In, SelectQueryBuilder } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { User } from '../../../auth/entities/user.entity';
import { UserRepository } from '../../../auth/repositories/user.repository';
import { FriendRequestResDto } from '../../dtos/common/friend/res/friend-request.res.dto';
import {
  GetListFriendRequestUserReqDto,
  GetListFriendSuggestionUserReqDto,
  ReplyFriendRequestAction,
  ReplyFriendRequestUserReqDto,
} from '../../dtos/user/req/friend-request.user.req.dto';
import { FriendRequest } from '../../entities/friend-request.entity';
import { FriendRequestRepository } from '../../repositories/friend-request.repository';

@Injectable()
export class FriendRequestUserService {
  constructor(
    private friendRequestRepo: FriendRequestRepository,
    private userRepo: UserRepository,
    private kafkaProducer: KafkaProducer,
  ) {}

  @Transactional()
  async getList(dto: GetListFriendRequestUserReqDto, user: User) {
    const { limit, page, status } = dto;
    let { searchText } = dto;

    const userId = dto.userId || user.id;

    const qb = this.friendRequestRepo
      .createQueryBuilder('f')
      .where(
        new Brackets((qb2) => {
          qb2
            .where('f.requesterId = :userId')
            .orWhere('f.beRequestedId = :userId', { userId });
        }),
      )
      .groupBy('f.id')
      .orderBy('f.id', 'DESC');

    if (searchText) {
      searchText = `%${searchText}%`;
      qb.innerJoin('f.requester', 'requester');
      qb.innerJoin('f.beRequested', 'requested');
      qb.innerJoin('requester.userProfile', 'up1');
      qb.innerJoin('requested.userProfile', 'up2');

      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('up1.name ILIKE :searchText')
            .orWhere('up2.name ILIKE :searchText', { searchText });
        }),
      );
    }

    if (status) {
      qb.andWhere('f.status = :status', { status });
      if (status === FriendRequestStatus.PENDING) {
        qb.andWhere('f.beRequestedId = :userId', { userId });
      }
    }

    const { items, meta } = await paginate(qb, { page, limit });

    const result = await Promise.all(
      items.map(async (item) => {
        let friendUser: User;

        if (item.requesterId === userId) {
          friendUser = await this.userRepo.findOne({
            where: { id: item.beRequestedId },
            relations: { userProfile: { avatar: true } },
          });
          item.beRequested = friendUser;
        } else {
          friendUser = await this.userRepo.findOne({
            where: { id: item.requesterId },
            relations: { userProfile: { avatar: true } },
          });
          item.requester = friendUser;
        }

        let mutualFriends: User[] = [];
        let isFriend = true;

        if (friendUser.id !== user.id) {
          const mutualFriendIds =
            await this.friendRequestRepo.getMutualFriendIds(
              friendUser.id,
              user.id,
            );
          isFriend = await this.friendRequestRepo.isFriend(
            friendUser.id,
            user.id,
          );

          mutualFriends = await this.userRepo.find({
            where: { id: In(mutualFriendIds) },
            relations: { userProfile: { avatar: true } },
          });
        }

        return FriendRequestResDto.forUser({
          data: item,
          isFriend,
          mutualFriends,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getFriendSuggestion(
    dto: GetListFriendSuggestionUserReqDto,
    user: User,
  ) {
    const { limit, page } = dto;
    let qb: SelectQueryBuilder<User>;

    const friends = await this.friendRequestRepo.find({
      where: [{ requesterId: user.id }, { beRequestedId: user.id }],
    });

    const friendIds: number[] = [];
    for (const friend of friends) {
      if (friend.beRequestedId === user.id) friendIds.push(friend.requesterId);
      else friendIds.push(friend.beRequestedId);
    }

    if (friendIds.length) {
      const friendOfFriends = await this.friendRequestRepo
        .createQueryBuilder('fr')
        .where(
          new Brackets((qb2) => {
            qb2
              .where('fr.beRequestedId IN (:...friendIds)')
              .orWhere('fr.requesterId IN (:...friendIds)', { friendIds });
          }),
        )
        .andWhere('fr.beRequestedId != :userId', { userId: user.id })
        .andWhere('fr.requesterId != :userId', { userId: user.id })
        .getMany();

      const friendOfFriendsUserIds: Set<number> = new Set();

      for (const friendOfFriend of friendOfFriends) {
        const isRequesterAlreadyFriend = friendIds.includes(
          friendOfFriend.requesterId,
        );
        const isBeRequestedAlreadyFriend = friendIds.includes(
          friendOfFriend.beRequestedId,
        );

        if (!isRequesterAlreadyFriend)
          friendOfFriendsUserIds.add(friendOfFriend.requesterId);
        if (!isBeRequestedAlreadyFriend)
          friendOfFriendsUserIds.add(friendOfFriend.beRequestedId);
      }

      friendOfFriendsUserIds.delete(user.id); //remove myself
      if (friendOfFriendsUserIds.size) {
        qb = this.userRepo
          .createQueryBuilder('u')
          .where('u.id IN (:...userIds)', {
            userIds: Array.from(friendOfFriendsUserIds),
          });
      }
    }

    if (!qb) {
      friendIds.push(user.id);
      qb = this.userRepo
        .createQueryBuilder('u')
        .andWhere('u.id NOT IN (:...friendIds)', { friendIds });
    }

    qb.innerJoinAndSelect('u.userProfile', 'up')
      .leftJoinAndSelect('up.avatar', 'a')
      .addOrderBy('u.id', 'DESC');

    const { items, meta } = await paginate(qb, { limit, page });

    const result = await Promise.all(
      items.map(async (item) => {
        const mutualFriendIds = await this.friendRequestRepo.getMutualFriendIds(
          item.id,
          user.id,
        );
        const mutualFriends = await this.userRepo.find({
          where: { id: In(mutualFriendIds) },
          relations: { userProfile: { avatar: true } },
        });

        return UserResDto.forUser({ data: item, mutualFriends });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async isFriend(userId: number, user: User) {
    const exist = await this.friendRequestRepo.exist({
      where: [
        {
          beRequestedId: user.id,
          requesterId: userId,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          beRequestedId: userId,
          requesterId: user.id,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });

    return exist;
  }

  @Transactional()
  async getFriend(userId: number, user: User) {
    const friendRequest = await this.friendRequestRepo.findOneBy([
      { beRequestedId: user.id, requesterId: userId },
      { beRequestedId: userId, requesterId: user.id },
    ]);

    return friendRequest;
  }

  @Transactional()
  async countFriend(userId: number, user: User) {
    const count = await this.friendRequestRepo.countBy([
      { beRequestedId: userId, status: FriendRequestStatus.ACCEPTED },
      { requesterId: userId, status: FriendRequestStatus.ACCEPTED },
    ]);

    return count;
  }

  @Transactional()
  async addFriend(userId: number, user: User) {
    let friendRequest = await this.friendRequestRepo.findOneBy([
      { requesterId: userId, beRequestedId: user.id },
      { beRequestedId: userId, requesterId: user.id },
    ]);

    if (friendRequest) {
      if (friendRequest.beRequestedId === user.id) {
        friendRequest.status = FriendRequestStatus.ACCEPTED;
        await this.friendRequestRepo.save(friendRequest);
      } else {
        throw new ExpectationFailedExc({ statusCode: 1000 });
      }
    } else {
      friendRequest = this.friendRequestRepo.create({
        requesterId: user.id,
        beRequestedId: userId,
        status: FriendRequestStatus.PENDING,
      });
      await this.friendRequestRepo.save(friendRequest);

      await this.sendFriendRequestCreatedKafka(friendRequest);
    }

    return FriendRequestResDto.forUser({ data: friendRequest });
  }

  @Transactional()
  async replyFriendRequest(dto: ReplyFriendRequestUserReqDto, user: User) {
    const { friendRequestId, action } = dto;

    const friendRequest = await this.friendRequestRepo.findOneBy({
      id: friendRequestId,
      beRequestedId: user.id,
    });

    if (!friendRequest) throw new ExpectationFailedExc({ statusCode: 1000 });

    if (friendRequest.status !== FriendRequestStatus.PENDING)
      throw new ExpectationFailedExc({ statusCode: 1000 });

    switch (action) {
      case ReplyFriendRequestAction.ACCEPTED:
        friendRequest.status = FriendRequestStatus.ACCEPTED;
        await this.friendRequestRepo.save(friendRequest);
        await this.sendFriendRequestUpdatedKafka(friendRequest);
        break;
      case ReplyFriendRequestAction.REJECTED:
        await this.friendRequestRepo.softDelete(friendRequest);
        await this.sendFriendRequestUpdatedKafka(friendRequest);
        break;
      default:
        throw new ExpectationFailedExc({ statusCode: 1000 });
    }
  }

  @Transactional()
  async delete(userId: number, user: User) {
    const friendRequest = await this.friendRequestRepo.findOneBy([
      { requesterId: userId, beRequestedId: user.id },
      { beRequestedId: userId, requesterId: user.id },
    ]);

    if (!friendRequest) throw new ExpectationFailedExc({ statusCode: 1000 });

    await this.friendRequestRepo.softDelete(friendRequest.id);

    await this.sendFriendRequestDeletedKafka(friendRequest);
  }

  private async sendFriendRequestCreatedKafka(friendRequest: FriendRequest) {
    const kafkaPayload = new FriendRequestCreatedKafkaPayload({
      beRequestedId: friendRequest.beRequestedId,
      id: friendRequest.id,
      requesterId: friendRequest.requesterId,
      status: friendRequest.status,
    });
    await this.kafkaProducer.send<FriendRequestCreatedKafkaPayload>({
      topic: KAFKA_TOPIC.FRIEND_REQUEST_CREATED,
      messages: [{ value: kafkaPayload, key: String(friendRequest.id) }],
    });
  }

  private async sendFriendRequestUpdatedKafka(friendRequest: FriendRequest) {
    const kafkaPayload = new FriendRequestUpdatedKafkaPayload({
      beRequestedId: friendRequest.beRequestedId,
      id: friendRequest.id,
      requesterId: friendRequest.requesterId,
      status: friendRequest.status,
    });
    await this.kafkaProducer.send<FriendRequestUpdatedKafkaPayload>({
      topic: KAFKA_TOPIC.FRIEND_REQUEST_UPDATED,
      messages: [{ value: kafkaPayload, key: String(friendRequest.id) }],
    });
  }

  private async sendFriendRequestDeletedKafka(friendRequest: FriendRequest) {
    const kafkaPayload = new FriendRequestDeletedKafkaPayload();
    kafkaPayload.friendRequestId = friendRequest.id;
    await this.kafkaProducer.send<FriendRequestDeletedKafkaPayload>({
      topic: KAFKA_TOPIC.FRIEND_REQUEST_DELETED,
      messages: [{ value: kafkaPayload, key: String(friendRequest.id) }],
    });
  }
}
