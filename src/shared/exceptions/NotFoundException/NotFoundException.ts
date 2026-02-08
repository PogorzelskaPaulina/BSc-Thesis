import { HttpStatus } from "../../HttpStatus/HttpStatus";
import { HttpException } from "../HttpException/HttpException";

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
