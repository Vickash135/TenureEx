import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type IdealAddress = {
  postcode?: string;

  postcode_inward?: string;
  postcode_outward?: string;

  post_town?: string;

  dependant_locality?: string;
  double_dependant_locality?: string;

  thoroughfare?: string;
  dependant_thoroughfare?: string;

  building_number?: string;
  building_name?: string;

  sub_building_name?: string;

  po_box?: string;
  department_name?: string;
  organisation_name?: string;

  udprn?: number;
  umprn?: string;
  uprn?: string;

  postcode_type?: string;

  su_organisation_indicator?: string;

  delivery_point_suffix?: string;

  line_1?: string;
  line_2?: string;
  line_3?: string;

  premise?: string;

  longitude?: number;
  latitude?: number;

  eastings?: number;
  northings?: number;

  country?: string;

  traditional_county?: string;
  administrative_county?: string;
  postal_county?: string;

  district?: string;
  ward?: string;
};

type IdealPostcodesResponse = {
  code: number;
  message: string;

  result?: IdealAddress[];

  page?: number;
  total_pages?: number;
};

@Injectable()
export class AddressLookupService {
  private readonly apiKey: string;

  private readonly baseUrl =
    "https://api.ideal-postcodes.co.uk/v1";

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>(
        "IDEAL_POSTCODES_API_KEY",
      );

    if (!apiKey) {
      throw new InternalServerErrorException(
        "IDEAL_POSTCODES_API_KEY is not configured.",
      );
    }

    this.apiKey =
      apiKey.trim();
  }

  // =========================================================
  // FIND ALL ADDRESSES FOR A POSTCODE
  // =========================================================

  async findByPostcode(
    postcode: string,
  ) {
    const cleanPostcode =
      this.normalisePostcode(
        postcode,
      );

    if (!cleanPostcode) {
      throw new BadRequestException(
        "Postcode is required.",
      );
    }

    const encodedPostcode =
      encodeURIComponent(
        cleanPostcode,
      );

    const encodedApiKey =
      encodeURIComponent(
        this.apiKey,
      );

    const url =
      `${this.baseUrl}/postcodes/${encodedPostcode}` +
      `?api_key=${encodedApiKey}`;

    try {
      const response =
        await fetch(
          url,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },
          },
        );

      const responseText =
        await response.text();

      let data:
        | IdealPostcodesResponse
        | null =
        null;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText,
              )
            : null;
      } catch {
        data =
          null;
      }

      // -------------------------------------------------------
      // POSTCODE NOT FOUND
      // -------------------------------------------------------

      if (
        response.status === 404
      ) {
        return {
          postcode:
            cleanPostcode,

          addresses: [],

          message:
            data?.message ??
            "Postcode not found.",
        };
      }

      // -------------------------------------------------------
      // API KEY / ACCOUNT PROBLEM
      // -------------------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        console.error(
          "Ideal Postcodes authentication failed:",
          response.status,
          responseText,
        );

        throw new BadGatewayException(
          "The address lookup service could not authenticate.",
        );
      }

      // -------------------------------------------------------
      // RATE / BALANCE LIMIT
      // -------------------------------------------------------

      if (
        response.status === 402 ||
        response.status === 429
      ) {
        console.error(
          "Ideal Postcodes limit reached:",
          response.status,
          responseText,
        );

        throw new BadGatewayException(
          "Address lookup allowance has been reached. Please try again later.",
        );
      }

      // -------------------------------------------------------
      // OTHER API ERROR
      // -------------------------------------------------------

      if (!response.ok) {
        console.error(
          "Ideal Postcodes lookup failed:",
          response.status,
          responseText,
        );

        throw new BadGatewayException(
          "Unable to search addresses at the moment.",
        );
      }

      const results =
        Array.isArray(
          data?.result,
        )
          ? data.result
          : [];

      // -------------------------------------------------------
      // CLEAN RESPONSE FOR FRONTEND
      // -------------------------------------------------------

      const addresses =
        results.map(
          (
            address,
            index,
          ) => {
            const residentialAddress =
              this.buildResidentialAddress(
                address,
              );

            const postcodeValue =
              address.postcode?.trim() ||
              cleanPostcode;

            const displayAddress =
              [
                residentialAddress,
                postcodeValue,
              ]
                .filter(Boolean)
                .join(", ");

            /*
             * Ideal Postcodes returns UDPRN/UPRN where available.
             * We only need a stable frontend identifier for now.
             */

            const id =
              String(
                address.uprn ??
                  address.udprn ??
                  address.umprn ??
                  `${postcodeValue}-${index}`,
              );

            return {
              id,

              displayAddress,

              residentialAddress,

              line1:
                address.line_1 ??
                "",

              line2:
                address.line_2 ??
                "",

              line3:
                address.line_3 ??
                "",

              buildingNumber:
                address.building_number ??
                "",

              buildingName:
                address.building_name ??
                "",

              subBuildingName:
                address.sub_building_name ??
                "",

              street:
                address.thoroughfare ??
                "",

              town:
                address.post_town ??
                "",

              district:
                address.district ??
                "",

              county:
                address.administrative_county ??
                address.postal_county ??
                address.traditional_county ??
                "",

              postcode:
                postcodeValue,

              country:
                address.country ??
                "",

              latitude:
                address.latitude ??
                null,

              longitude:
                address.longitude ??
                null,

              uprn:
                address.uprn ??
                null,
            };
          },
        );

      return {
        postcode:
          cleanPostcode,

        count:
          addresses.length,

        addresses,
      };
    } catch (error) {
      if (
        error instanceof
          BadGatewayException ||
        error instanceof
          BadRequestException
      ) {
        throw error;
      }

      console.error(
        "Ideal Postcodes connection error:",
        error,
      );

      throw new BadGatewayException(
        "Unable to connect to the address lookup service.",
      );
    }
  }

  // =========================================================
  // BUILD RESIDENTIAL ADDRESS
  // =========================================================

  private buildResidentialAddress(
    address: IdealAddress,
  ) {
    /*
     * Ideal Postcodes already provides line_1 / line_2 / line_3.
     * Those are the safest formatted address lines to use.
     */

    const formattedLines = [
      address.line_1,
      address.line_2,
      address.line_3,
      address.post_town,
    ]
      .map(
        (value) =>
          value?.trim(),
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

    /*
     * Remove duplicate values such as a town appearing
     * both in line_3 and post_town.
     */

    return Array.from(
      new Set(
        formattedLines,
      ),
    ).join(
      ", ",
    );
  }

  // =========================================================
  // NORMALISE UK POSTCODE
  // =========================================================

  private normalisePostcode(
    postcode: string,
  ) {
    return postcode
      .trim()
      .replace(
        /\s+/g,
        " ",
      )
      .toUpperCase();
  }
}