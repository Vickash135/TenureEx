import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomInt } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
@Injectable()
export class MarketplaceService {
  private readonly verificationAttempts = new Map<string, { count: number; until: number }>();

  constructor(private readonly prisma:PrismaService,private readonly mail:MailService,private readonly jwt:JwtService) {}
  async register(dto:any) {
    if(dto.password!==dto.confirmPassword) throw new BadRequestException("Passwords do not match");
    const email=dto.email.trim().toLowerCase();
    if(await this.prisma.user.findUnique({where:{email}}))throw new ConflictException("Account already exists; please log in");
    const [firstName,...rest]=dto.name.trim().split(/\s+/);
    const code=String(randomInt(0,1000000)).padStart(6,"0");
    const user=await this.prisma.user.create({data:{firstName,lastName:rest.join(" ")||" ",email,phone:dto.phone.trim(),passwordHash:await argon2.hash(dto.password),userType:"NORMAL_USER",status:"PENDING_EMAIL_VERIFICATION"}});
    await this.prisma.emailVerificationToken.create({data:{userId:user.id,tokenHash:await argon2.hash(code),expiresAt:new Date(Date.now()+600000)}});
    await this.mail.sendMarketplaceVerification(email,firstName,code);
    return {message:"Verification code emailed",email};
  }
  async verify(dto:any){
    const user=await this.prisma.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});
    if(!user||user.userType!=="NORMAL_USER") throw new BadRequestException("Invalid verification request");
    if(user.emailVerified)return {message:"Already verified"};
    const attempts = this.verificationAttempts.get(user.id);
    if (attempts && attempts.until > Date.now() && attempts.count >= 5) throw new BadRequestException("Too many verification attempts. Try again in 15 minutes.");
    const tokens=await this.prisma.emailVerificationToken.findMany({where:{userId:user.id,usedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:"desc"},take:5});
    for(const token of tokens){if(await argon2.verify(token.tokenHash,dto.code)){
      await this.prisma.$transaction([this.prisma.emailVerificationToken.update({where:{id:token.id},data:{usedAt:new Date()}}),this.prisma.user.update({where:{id:user.id},data:{emailVerified:true,status:"ACTIVE",activatedAt:new Date()}})]);
      this.verificationAttempts.delete(user.id);
      return {message:"Email verified. You can log in."};
    }}
    const next = this.verificationAttempts.get(user.id);
    this.verificationAttempts.set(user.id, {count: next && next.until > Date.now() ? next.count+1 : 1,until:Date.now()+15*60*1000});
    throw new BadRequestException("Invalid or expired verification code");
  }
  async resend(emailInput:string){
    const email = String(emailInput || "").trim().toLowerCase();
    const user = await this.prisma.user.findUnique({where:{email}});
    if (!user || user.userType!=="NORMAL_USER" || user.emailVerified) return {message:"If an unverified account exists, a code will be sent."};
    const last = await this.prisma.emailVerificationToken.findFirst({where:{userId:user.id},orderBy:{createdAt:"desc"}});
    if (last && Date.now()-last.createdAt.getTime()<60_000) throw new BadRequestException("Please wait one minute before requesting another code.");
    const code=String(randomInt(0,1000000)).padStart(6,"0");
    await this.prisma.emailVerificationToken.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}});
    await this.prisma.emailVerificationToken.create({data:{userId:user.id,tokenHash:await argon2.hash(code),expiresAt:new Date(Date.now()+600000)}});
    await this.mail.sendMarketplaceVerification(email,user.firstName,code);
    return {message:"If an unverified account exists, a code will be sent."};
  }
  async login(dto:any){
    const user=await this.prisma.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});
    if(!user||user.userType!=="NORMAL_USER"||!user.passwordHash||!(await argon2.verify(user.passwordHash,dto.password)))throw new UnauthorizedException("Invalid login");
    if(!user.emailVerified||user.status!=="ACTIVE")throw new UnauthorizedException("Verify your email to activate your account");
    return {accessToken:await this.jwt.signAsync({sub:user.id,email:user.email,userType:user.userType},{secret:process.env.JWT_ACCESS_SECRET,expiresIn:"1h"}),user:{id:user.id,name:`${user.firstName} ${user.lastName}`.trim(),email:user.email,userType:user.userType}};
  }
  private async owner(auth:any){const user=await this.prisma.user.findUnique({where:{id:auth.sub}});if(!user||user.userType!=="NORMAL_USER"||user.status!=="ACTIVE"||!user.emailVerified)throw new ForbiddenException("Normal user account required");return user;}
  async mine(auth:any){const u=await this.owner(auth);return this.prisma.property.findMany({where:{marketplaceOwnerId:u.id},orderBy:{createdAt:"desc"}});}
  private fields(d:any){return {advertisingTitle:d.title,addressLine1:d.addressLine1,townCity:d.townCity,postcode:d.postcode,propertyType:d.propertyType,bedrooms:d.bedrooms,bathrooms:d.bathrooms,monthlyRent:d.monthlyRent,description:d.description||null,contactName:d.contactName,contactEmail:d.contactEmail,contactPhone:d.contactPhone};}
  async add(auth:any,d:any){const u=await this.owner(auth);return this.prisma.property.create({data:{...this.fields(d),marketplaceOwnerId:u.id,approvalStatus:"APPROVED",propertyStatus:"VACANT",advertisingAllowed:true,approvedAt:new Date()}});}
  async edit(auth:any,id:string,d:any){const u=await this.owner(auth);await this.owned(u.id,id);return this.prisma.property.update({where:{id},data:this.fields(d)});}
  async remove(auth:any,id:string){const u=await this.owner(auth);await this.owned(u.id,id);await this.prisma.property.delete({where:{id}});return {message:"Listing deleted"};}
  private async owned(userId:string,id:string){const found=await this.prisma.property.findFirst({where:{id,marketplaceOwnerId:userId}});if(!found)throw new NotFoundException("Your property was not found");return found;}
  async upload(auth:any,id:string,files:Express.Multer.File[]){const u=await this.owner(auth);const p=await this.owned(u.id,id);if(!files?.length)throw new BadRequestException("No photos attached");if(p.photoNames.length+files.length>10)throw new BadRequestException("Maximum 10 photos");return this.prisma.property.update({where:{id},data:{photoNames:{push:files.map(f=>f.filename)}}});}
}
