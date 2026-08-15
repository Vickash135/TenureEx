import {
    BadRequestException,
    Body,
    Controller,
    Param,
    ParseUUIDPipe,
    Post,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";

import { StartLandlordRegistrationDto } from "./dto/start-landlord-registration.dto";
import { VerifyLandlordEmailDto } from "./dto/verify-landlord-email.dto";
import { VerifyLandlordPhoneDto } from "./dto/verify-landlord-phone.dto";
import { LandlordRegistrationService } from "./landlord-registration.service";

const identificationUploadDirectory = join(
  process.cwd(),
  "uploads",
  "landlords",
  "identification",
);

mkdirSync(
  identificationUploadDirectory,
  {
    recursive: true,
  },
);

@Controller("landlord-registration")
export class LandlordRegistrationController {
  constructor(
    private readonly landlordRegistrationService:
      LandlordRegistrationService,
  ) {}

  @Post("start")
  start(
    @Body()
    dto: StartLandlordRegistrationDto,
  ) {
    return this.landlordRegistrationService.start(
      dto,
    );
  }

  @Post("verify-email")
  verifyEmail(
    @Body()
    dto: VerifyLandlordEmailDto,
  ) {
    return this.landlordRegistrationService.verifyEmail(
      dto,
    );
  }

  @Post("send-phone-otp/:userId")
  sendPhoneOtp(
    @Param(
      "userId",
      ParseUUIDPipe,
    )
    userId: string,
  ) {
    return this.landlordRegistrationService.sendPhoneOtp(
      userId,
    );
  }

  @Post("verify-phone")
  verifyPhone(
    @Body()
    dto: VerifyLandlordPhoneDto,
  ) {
    return this.landlordRegistrationService.verifyPhone(
      dto,
    );
  }

  @Post("upload-identification/:userId")
  @UseInterceptors(
    FileInterceptor(
      "identificationFile",
      {
        storage: diskStorage({
          destination: (
            _request,
            _file,
            callback,
          ) => {
            callback(
              null,
              identificationUploadDirectory,
            );
          },

          filename: (
            _request,
            file,
            callback,
          ) => {
            const extension =
              extname(
                file.originalname,
              ).toLowerCase();

            callback(
              null,
              `${randomUUID()}${extension}`,
            );
          },
        }),

        limits: {
          fileSize:
            10 * 1024 * 1024,
        },

        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          const allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
          ];

          if (
            !allowedMimeTypes.includes(
              file.mimetype,
            )
          ) {
            callback(
              new BadRequestException(
                "Identification document must be a PDF, JPG, JPEG or PNG file.",
              ),
              false,
            );

            return;
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  uploadIdentification(
    @Param(
      "userId",
      ParseUUIDPipe,
    )
    userId: string,

    @UploadedFile()
    file?: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        "Please select an identification document to upload.",
      );
    }

    const identificationFileUrl =
      `/uploads/landlords/identification/${file.filename}`;

    return this.landlordRegistrationService.saveIdentificationDocument(
      userId,
      identificationFileUrl,
    );
  }
}
