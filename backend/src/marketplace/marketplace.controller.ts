import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";
import { mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MarketplaceService } from "./marketplace.service";

class RegisterDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(7) @MaxLength(25) phone!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() confirmPassword!: string;
}
class VerifyDto { @IsEmail() email!: string; @Matches(/^\d{6}$/) code!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
class ListingDto {
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsString() @IsNotEmpty() addressLine1!: string;
  @IsString() @IsNotEmpty() townCity!: string;
  @IsString() @IsNotEmpty() postcode!: string;
  @IsIn(["HOUSE","FLAT","STUDIO","BUNGALOW","MAISONETTE","OTHER"]) propertyType!: string;
  @IsInt() @Min(0) bedrooms!: number;
  @IsInt() @Min(0) bathrooms!: number;
  @IsNumber() @Min(1) monthlyRent!: number;
  @IsOptional() @IsString() description?: string;
  @IsString() @IsNotEmpty() contactName!: string;
  @IsEmail() contactEmail!: string;
  @IsString() @IsNotEmpty() contactPhone!: string;
}
const uploadDir = join(process.cwd(), "uploads", "properties");
mkdirSync(uploadDir, {recursive:true});
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}
  @Post("register") register(@Body() dto: RegisterDto) { return this.service.register(dto); }
  @Post("verify-email") verify(@Body() dto: VerifyDto) { return this.service.verify(dto); }
  @Post("resend-code") resend(@Body() dto: {email:string}) {return this.service.resend(dto.email);}
  @Post("login") login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @UseGuards(JwtAuthGuard) @Get("my-properties") mine(@Req() req: any) {return this.service.mine(req.user);}
  @UseGuards(JwtAuthGuard) @Post("properties") add(@Req() req: any, @Body() dto: ListingDto) {return this.service.add(req.user,dto);}
  @UseGuards(JwtAuthGuard) @Patch("properties/:id") edit(@Req() req: any,@Param("id",ParseUUIDPipe) id:string,@Body() dto: ListingDto) {return this.service.edit(req.user,id,dto);}
  @UseGuards(JwtAuthGuard) @Delete("properties/:id") remove(@Req() req: any,@Param("id",ParseUUIDPipe) id:string) {return this.service.remove(req.user,id);}
  @UseGuards(JwtAuthGuard) @Post("properties/:id/photos")
  @UseInterceptors(FilesInterceptor("photos",10,{storage:diskStorage({destination:uploadDir,filename:(_r,f,cb)=>cb(null,`${Date.now()}-${require("crypto").randomBytes(8).toString("hex")}${extname(f.originalname).toLowerCase()}`)}),limits:{fileSize:10*1024*1024,files:10},fileFilter:(_r,f,cb)=>{if(!["image/jpeg","image/png","image/webp"].includes(f.mimetype))return cb(new BadRequestException("Only JPEG, PNG and WebP supported"),false);cb(null,true);}}))
  upload(@Req() req:any,@Param("id",ParseUUIDPipe) id:string,@UploadedFiles() files:Express.Multer.File[]){return this.service.upload(req.user,id,files);}
}
