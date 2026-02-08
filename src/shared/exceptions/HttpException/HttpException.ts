export abstract class HttpException extends Error {
  constructor(message: string, readonly code: number) {
    super(message);
  }
}
