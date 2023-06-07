import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { FriendRequest } from '../entities/friend-request.entity';

@Injectable()
export class FriendRequestRepository extends BaseRepository<FriendRequest> {
  constructor(dataSource: DataSource) {
    super(FriendRequest, dataSource);
  }
}
