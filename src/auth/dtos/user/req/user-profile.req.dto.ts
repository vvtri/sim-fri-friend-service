import { IsValidText } from 'common';
import { PaginationReqDto } from '../../../../common/dtos/pagination.dto';

export class SearchProfileUserReqDto extends PaginationReqDto {
  @IsValidText({ required: false })
  searchText?: string;
}
