import { MigrationInterface, QueryRunner } from "typeorm";

export class ImplFriend1686065065759 implements MigrationInterface {
    name = 'ImplFriend1686065065759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."friend_request_status_enum" AS ENUM('PENDING', 'ACCEPTED')`);
        await queryRunner.query(`CREATE TABLE "friend_request" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "status" "public"."friend_request_status_enum" NOT NULL, "requester_id" integer NOT NULL, "be_requested_id" integer NOT NULL, CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "friend_request" ADD CONSTRAINT "FK_051481804af16428556fe9c9c5c" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_request" ADD CONSTRAINT "FK_8ba30b9c219ddb379230f8923a1" FOREIGN KEY ("be_requested_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS hstore SCHEMA public;`)
        await queryRunner.query(`CREATE UNIQUE INDEX "UNIQUE_FRIEND" ON "friend_request" USING BTREE (hstore(ARRAY[requester_id::text, be_requested_id::text], ARRAY[null,null]));`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friend_request" DROP CONSTRAINT "FK_8ba30b9c219ddb379230f8923a1"`);
        await queryRunner.query(`ALTER TABLE "friend_request" DROP CONSTRAINT "FK_051481804af16428556fe9c9c5c"`);
        await queryRunner.query(`DROP TABLE "friend_request"`);
        await queryRunner.query(`DROP TYPE "public"."friend_request_status_enum"`);
        await queryRunner.query(`DROP INDEX "UNIQUE_FRIEND"`)
    }

}
