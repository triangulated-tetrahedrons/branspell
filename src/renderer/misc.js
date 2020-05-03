class Misc {
  sleepAsync (ms) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms)
    })
  }

  randChoice (array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  assert (condition) {
    if (!condition) {
      // const err = new Error()
      // console.error(err.stack)
      throw new Error(`��� ASSERTION FAILED ���`)
    }
  }
}

export default new Misc()
