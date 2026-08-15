import {
    Controller,
    Get,
    Param,
} from "@nestjs/common";

import {
    AddressLookupService,
} from "./address-lookup.service";

@Controller("address-lookup")
export class AddressLookupController {
  constructor(
    private readonly addressLookupService:
      AddressLookupService,
  ) {}

  @Get("postcode/:postcode")
  findByPostcode(
    @Param("postcode")
    postcode: string,
  ) {
    return this.addressLookupService
      .findByPostcode(
        postcode,
      );
  }
}