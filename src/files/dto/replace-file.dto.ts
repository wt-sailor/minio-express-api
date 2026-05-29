import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ReplaceFileDto {
  @ApiProperty({
    description: "Target bucket name",
    required: false,
    example: "testing",
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: "Folder path inside the bucket",
    required: false,
    example: "documents",
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: "Existing file name to replace",
    required: true,
    example: "logo.png",
  })
  @IsString()
  @IsNotEmpty({ message: "File name is required" })
  name: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "New file to replace the old one",
  })
  file: any;
}
