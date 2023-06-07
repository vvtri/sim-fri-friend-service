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
import { Brackets } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { UserRepository } from '../../../auth/repositories/user.repository';
import { FriendRequestResDto } from '../../dtos/common/friend/res/friend-request.res.dto';
import {
  GetListFriendRequestUserReqDto,
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

        return FriendRequestResDto.forUser({ data: item });
      }),
    );

    return new Pagination(result, meta);
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

    if (friendRequest) throw new ExpectationFailedExc({ statusCode: 1000 });

    friendRequest = this.friendRequestRepo.create({
      requesterId: user.id,
      beRequestedId: userId,
      status: FriendRequestStatus.PENDING,
    });
    await this.friendRequestRepo.save(friendRequest);

    await this.sendFriendRequestCreatedKafka(friendRequest);
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
  async unFriend(userId: number, user: User) {
    const friendRequest = await this.friendRequestRepo.findOneBy([
      { requesterId: userId, beRequestedId: user.id },
      { beRequestedId: userId, requesterId: user.id },
    ]);

    if (!friendRequest) throw new ExpectationFailedExc({ statusCode: 1000 });

    if (friendRequest.status !== FriendRequestStatus.ACCEPTED)
      throw new ExpectationFailedExc({ statusCode: 1000 });

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
      messages: [
        { value: kafkaPayload, headers: { id: String(friendRequest.id) } },
      ],
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
      messages: [
        { value: kafkaPayload, headers: { id: String(friendRequest.id) } },
      ],
    });
  }

  private async sendFriendRequestDeletedKafka(friendRequest: FriendRequest) {
    const kafkaPayload = new FriendRequestDeletedKafkaPayload();
    kafkaPayload.friendRequestId = friendRequest.id;
    await this.kafkaProducer.send<FriendRequestDeletedKafkaPayload>({
      topic: KAFKA_TOPIC.FRIEND_REQUEST_DELETED,
      messages: [
        { value: kafkaPayload, headers: { id: String(friendRequest.id) } },
      ],
    });
  }
}
