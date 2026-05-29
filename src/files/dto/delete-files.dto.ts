import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class DeleteFilesDto {
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
    description: "List of file names to delete",
    required: true,
    type: [String],
    example: ["logo.png", "document.pdf"],
  })
  @IsArray()
  @IsNotEmpty({ message: "No files provided" })
  names: string[];
}
