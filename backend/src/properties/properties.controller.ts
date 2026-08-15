import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { FilesInterceptor } from "@nestjs/platform-express";
import { existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { PropertiesService } from "./properties.service";

const propertyUploadDirectory = join(
  process.cwd(),
  "uploads",
  "properties",
);

if (!existsSync(propertyUploadDirectory)) {
  mkdirSync(propertyUploadDirectory, {
    recursive: true,
  });
}

@Controller("landlord-properties")
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  // =========================================================
  // CREATE PROPERTY
  // =========================================================

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(
      user.sub,
      dto,
    );
  }

  // =========================================================
  // GET ALL PROPERTIES FOR LOGGED-IN LANDLORD
  // =========================================================

  @Get()
  findMine(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.findMine(
      user.sub,
    );
  }

  // =========================================================
  // UPLOAD PROPERTY PHOTOS
  // =========================================================

  @Post(":id/photos")
  @UseInterceptors(
    FilesInterceptor(
      "photos",
      10,
      {
        storage: diskStorage({
          destination: (
            _request,
            _file,
            callback,
          ) => {
            callback(
              null,
              propertyUploadDirectory,
            );
          },

          filename: (
            _request,
            file,
            callback,
          ) => {
            const extension =
              extname(file.originalname)
                .toLowerCase();

            const uniqueName =
              `${Date.now()}-${Math.round(
                Math.random() * 1e9,
              )}${extension}`;

            callback(
              null,
              uniqueName,
            );
          },
        }),

        limits: {
          fileSize: 10 * 1024 * 1024,
          files: 10,
        },

        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ];

          if (
            !allowedMimeTypes.includes(
              file.mimetype,
            )
          ) {
            return callback(
              new BadRequestException(
                "Only JPG, JPEG, PNG and WEBP property photos are allowed.",
              ),
              false,
            );
          }

          callback(null, true);
        },
      },
    ),
  )
  uploadPhotos(
    @CurrentUser() user: AuthenticatedUser,

    @Param(
      "id",
      ParseUUIDPipe,
    )
    propertyId: string,

    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        "Please select at least one property photo.",
      );
    }

    return this.propertiesService.addPhotos(
      user.sub,
      propertyId,
      files,
    );
  }

  // =========================================================
  // GET ONE PROPERTY
  //
  // IMPORTANT:
  // Keep this BELOW :id/photos
  // =========================================================

  @Get(":id")
  findOneMine(
    @CurrentUser() user: AuthenticatedUser,

    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.propertiesService.findOneMine(
      user.sub,
      id,
    );
  }

  // =========================================================
  // UPDATE PROPERTY
  // =========================================================

  @Patch(":id")
  updateMine(
    @CurrentUser() user: AuthenticatedUser,

    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateMine(
      user.sub,
      id,
      dto,
    );
  }

  // =========================================================
  // DELETE PROPERTY
  // =========================================================

  @Delete(":id")
  removeMine(
    @CurrentUser() user: AuthenticatedUser,

    @Param(
      "id",
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.propertiesService.removeMine(
      user.sub,
      id,
    );
  }
}