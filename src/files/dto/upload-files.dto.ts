import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UploadFilesDto {
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
    description: "Generate random name for files",
    required: false,
    default: "true",
    enum: ["true", "false"],
  })
  @IsString()
  @IsOptional()
  randomName?: string;

  @ApiProperty({
    type: "array",
    items: {
      type: "string",
      format: "binary",
    },
    description: "Files to upload",
  })
  files: any[];
}
