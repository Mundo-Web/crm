class Global {
  static APP_NAME = null;
  static WA_URL = null;
  static PUBLIC_RSA_KEY = null;
  static APP_PROTOCOL = null;
  static APP_URL = null;
  static APP_DOMAIN = null;
  static APP_CORRELATIVE = null;

  static set = (name, value) => {
    Global[name] = value;
  }

  static get = (name) => {
    return Global[name]
  }
}

export default Global