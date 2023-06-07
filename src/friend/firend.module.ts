import { Module } from '@nestjs/common';
import { TypeOrmCustomModule } from 'common';
import { UserRepository } from '../auth/repositories/user.repository';
import { FriendRequestUserController } from './controllers/user/friend-request.user.controller';
import { FriendRequestRepository } from './repositories/friend-request.repository';
import { FriendRequestUserService } from './services/user/friend-request.user.service';

@Module({
  controllers: [FriendRequestUserController],
  imports: [
    TypeOrmCustomModule.forFeature([FriendRequestRepository, UserRepository]),
  ],
  providers: [FriendRequestUserService],
})
export class FriendModule {}
