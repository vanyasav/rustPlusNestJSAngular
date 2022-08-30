import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  serverName: string;

  @IsString()
  @IsNotEmpty()
  serverIp: string;

  @IsNumber()
  @IsNotEmpty()
  appPort: number;

  @IsString()
  @IsNotEmpty()
  playerToken: string;

  @IsBoolean()
  @IsNotEmpty()
  isSelected = true;
}
