class Misc {
  sleepAsync (ms) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms)
    })
  }
}

export default new Misc()
