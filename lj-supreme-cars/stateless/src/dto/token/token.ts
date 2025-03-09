export interface Token {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
  expires_at: number;
}

export interface ReturnToken {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}
