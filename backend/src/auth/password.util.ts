import * as argon2 from 'argon2';

// OWASP-recommended baseline for argon2id. Used everywhere a password is
// hashed (registration, change-password, password reset) so all three paths
// stay in sync — previously this lived inline in AuthService.register only.
export const ARGON2ID_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
