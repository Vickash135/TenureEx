import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { PropertiesService } from "./properties.service";

@Controller("properties")
export class PublicPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findApproved(
    @Query("location") location?: string,
    @Query("minBedrooms") minBedrooms?: string,
    @Query("maxRent") maxRent?: string,
    @Query("propertyType") propertyType?: string,
  ) {
    return this.propertiesService.findApprovedPublic({ location, minBedrooms, maxRent, propertyType });
  }

  @Get(":id")
  findApprovedOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.propertiesService.findApprovedPublicOne(id);
  }
}
