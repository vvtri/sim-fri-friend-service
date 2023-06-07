import { MigrationInterface, QueryRunner } from "typeorm"

export class FixUniqueIndexFriendRequest1686102112699 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UNIQUE_FRIEND"`)
        await queryRunner.query(`CREATE UNIQUE INDEX "UNIQUE_FRIEND" ON "friend_request" USING BTREE (hstore(ARRAY[requester_id::text, be_requested_id::text], ARRAY[null,null])) WHERE deleted_at IS NULL;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UNIQUE_FRIEND"`)
        await queryRunner.query(`CREATE UNIQUE INDEX "UNIQUE_FRIEND" ON "friend_request" USING BTREE (hstore(ARRAY[requester_id::text, be_requested_id::text], ARRAY[null,null]));`)
    }

}
