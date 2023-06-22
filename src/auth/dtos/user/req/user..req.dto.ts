import { IsValidArrayNumber, IsValidText } from 'common';
import { PaginationReqDto } from '../../../../common/dtos/pagination.dto';

export class SearchProfileUserReqDto extends PaginationReqDto {
  @IsValidText({ required: false })
  searchText?: string;

  @IsValidArrayNumber({ minSize: 0, required: false })
  excludedIds: number[];
}
