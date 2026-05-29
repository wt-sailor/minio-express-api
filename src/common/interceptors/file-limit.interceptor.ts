import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { MAX_UPLOAD_FILES } from "../constants";

@Injectable()
export class FileLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const files = request.files as Express.Multer.File[];

    if (files && files.length > 0) {
      const totalFiles = files.length;

      if (totalFiles > MAX_UPLOAD_FILES) {
        // Slice files array to limit
        request.files = files.slice(0, MAX_UPLOAD_FILES);

        // Inject metadata into request object
        request.fileUploadMetadata = {
          totalReceived: totalFiles,
          uploaded: MAX_UPLOAD_FILES,
          discarded: totalFiles - MAX_UPLOAD_FILES,
        };
      }
    }

    return next.handle();
  }
}
