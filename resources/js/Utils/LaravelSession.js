class LaravelSession {
  static name = null
  
  static set = (name, value) => {
    LaravelSession[name] = value;
  }

  static get = (name) => {
    return LaravelSession[name]
  }
}

export default LaravelSession