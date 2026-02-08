import { HttpStatus } from "../../HttpStatus/HttpStatus";
import { HttpException } from "../HttpException/HttpException";

export class NotModifiedException extends HttpException {
  constructor(message = "Not modified") {
    super(message, HttpStatus.NOT_MODIFIED);
  }
}
