import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileType1686908128130 implements MigrationInterface {
    name = 'AddFileType1686908128130'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."file_file_type_enum" RENAME TO "file_file_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."file_file_type_enum" AS ENUM('png', 'jpg', 'jpeg', 'pdf', 'mp3', 'mp4', 'wav', 'xlsx', 'xls', 'csv', 'unknown')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "file_type" TYPE "public"."file_file_type_enum" USING "file_type"::"text"::"public"."file_file_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."file_file_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."file_file_type_enum_old" AS ENUM('png', 'jpg', 'jpeg', 'pdf', 'mp3', 'mp4', 'wav', 'xlsx', 'xls', 'csv')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "file_type" TYPE "public"."file_file_type_enum_old" USING "file_type"::"text"::"public"."file_file_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."file_file_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."file_file_type_enum_old" RENAME TO "file_file_type_enum"`);
    }

}
