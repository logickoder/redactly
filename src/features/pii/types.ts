export interface PiiSettings {
  email: boolean;
  url: boolean;
  phone: boolean;
}

export const defaultPiiSettings: PiiSettings = {
  email: false,
  url: false,
  phone: false,
};
