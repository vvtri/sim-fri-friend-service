import { BaseEntity } from 'common';
import { FriendRequestStatus } from 'shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Index } from 'typeorm/decorator/Index';
import { User } from '../../auth/entities/user.entity';
import { INDEX_NAME } from '../../common/constants/index.constant';

@Entity()
@Index(INDEX_NAME.UNIQUE_FRIEND, { synchronize: false })
export class FriendRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: FriendRequestStatus })
  status: FriendRequestStatus;

  @Column()
  requesterId: number;

  @ManyToOne(() => User, (u) => u.friendRequesters)
  @JoinColumn()
  requester: User;

  @Column()
  beRequestedId: number;

  @ManyToOne(() => User, (u) => u.friendBeRequesteds)
  @JoinColumn()
  beRequested: User;
}
