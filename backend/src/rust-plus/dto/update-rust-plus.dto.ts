import { PartialType } from '@nestjs/mapped-types';
import { CreateRustPlusDto } from './create-rust-plus.dto';

export class UpdateRustPlusDto extends PartialType(CreateRustPlusDto) {}
