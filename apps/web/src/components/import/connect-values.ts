export type PlankaSignIn = "apiKey" | "password";

export type ImportConnectValues = {
  url: string;
  apiKey: string;
  token: string;
  username: string;
  email: string;
  password: string;
  plankaSignIn: PlankaSignIn;
  document: string;
  fileName: string;
  documentTooLarge: boolean;
};

export const EMPTY_CONNECT_VALUES: ImportConnectValues = {
  url: "",
  apiKey: "",
  token: "",
  username: "",
  email: "",
  password: "",
  plankaSignIn: "apiKey",
  document: "",
  fileName: "",
  documentTooLarge: false,
};
