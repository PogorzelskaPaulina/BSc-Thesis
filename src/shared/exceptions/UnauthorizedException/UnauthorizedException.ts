import { HttpStatus } from "../../HttpStatus/HttpStatus";
import { HttpException } from "../HttpException/HttpException";

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
