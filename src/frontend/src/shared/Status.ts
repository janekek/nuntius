export interface StatusDetail {
  readonly msg: string;
  readonly code: number;
}

export class Status {
  //Basic
  static readonly OK: StatusDetail = { msg: "Ok.", code: 100 };
  static readonly ERROR: StatusDetail = {
    msg: "An error has occurred.",
    code: 101,
  };

  // Auth
  static readonly USER_NOT_LOGGED_IN: StatusDetail = {
    msg: "The user is not logged in.",
    code: 201,
  };
  static readonly USER_NOT_ALLOWED: StatusDetail = {
    msg: "The user is not allowed to perform this action",
    code: 202,
  };
  static readonly USER_NOT_PART_OF_CHAT: StatusDetail = {
    msg: "The user is not a part of this chat",
    code: 203,
  };

  // Login
  static readonly LOGIN_USERNAME_OR_PASSWORD_INCORRECT: StatusDetail = {
    msg: "The combination of username and password doesn't match",
    code: 301,
  };

  // Sign-up
  static readonly USER_LOGGED_IN: StatusDetail = {
    msg: "The user cannot perform this action because they are logged in",
    code: 401,
  };
  static readonly USERNAME_TAKEN: StatusDetail = {
    msg: "The username is already taken",
    code: 402,
  };
  static readonly USERNAME_TOO_SHORT: StatusDetail = {
    msg: "The username is too short",
    code: 403,
  };
  static readonly PASSWORDS_MATCH: StatusDetail = {
    msg: "The password are not allowed to match",
    code: 404,
  };
  static readonly USERNAME_INVALID: StatusDetail = {
    msg: "The username contains invalid characters",
    code: 405,
  };
  static readonly PASSWORD_WEAK: StatusDetail = {
    msg: "The password does not meet the security requirements",
    code: 406,
  };
  static readonly PASSWORD_INVALID: StatusDetail = {
    msg: "The password contains invalid characters",
    code: 407,
  };
  static readonly USERNAME_TOO_LONG: StatusDetail = {
    msg: "The username is too long",
    code: 408,
  };

  //Chats
  static readonly CHAT_NOT_FOUND: StatusDetail = {
    msg: "The requested chat does not exist",
    code: 501,
  };
  static readonly CHAT_ALREADY_EXISTS: StatusDetail = {
    msg: "The requested chat already exists",
    code: 502,
  };
}
