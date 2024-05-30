export class ReadNotAllowedError extends Error {
  constructor() {
    super(ReadNotAllowedError.name);
  }
}

export class WriteNotAllowedError extends Error {
  constructor() {
    super(WriteNotAllowedError.name);
  }
}
