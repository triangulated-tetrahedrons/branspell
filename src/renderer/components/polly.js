import { Howl } from 'howler'

const AWS = require('aws-sdk')
// const Stream = require('stream')
// const Speaker = require('speaker')
const path = require('path')
const Fs = require('fs')

class Speech {
  constructor ({audio, wordMarks, duration, text}) {
    this.wordMarks = wordMarks
    this.audio = audio
    this.duration = duration
    this.text = text
  }
}

class WordMark {
  constructor ({time, start, end, value}) {
    // {"time":2069,"type":"word","start":12,"end":18,"value":"sadsad"}
    this.time = time
    this.start = start
    this.end = end
    this.value = value
  }
}

class Polly {
  constructor () {
    this.polly = new AWS.Polly({
      signatureVersion: 'v4',
      region: 'us-west-2'
    })
  }

  read = (params) => this._read(params)
  async _read ({
    Text = 'test', VoiceId = 'Kimberly',
    filename = './speech.mp3'
  }) {
    const wordMarkPromise = this._getWordMarks({
      Text: Text, VoiceId: VoiceId, filename: filename
    })
    const audioPromise = this._buildAudio({
      Text: Text, VoiceId: VoiceId
    })

    const promises = [wordMarkPromise, audioPromise]
    const [strWordMarks, audio] = await Promise.all(promises)
    const duration = 1000 * await new Promise((resolve) => {
      audio.on('load', () => { resolve(audio.duration()) })
    })

    console.log('WMARKS', strWordMarks)
    console.log('DURATION', duration)
    const rawMarks = strWordMarks.split('\n')
    // {"time":2069,"type":"word","start":12,"end":18,"value":"sadsad"}
    
    const parsedMarks = []
    for (let k = 0; k < rawMarks.length; k++) {
      if (rawMarks[k] === '') { break }
      const parsed = JSON.parse(rawMarks[k])
      parsedMarks.push(parsed)
    }

    const wordMarks = []
    for (let k = 0; k < rawMarks.length; k++) {
      
    }

    const speech = new Speech({
      audio: audio,
      wordMarks: wordMarks,
      duration: duration,
      text: Text
    })

    console.log('PP', speech)
    return speech
  }

  buildAudio = (params) => this._buildAudio(params)
  async _buildAudio ({
    Text = 'test', VoiceId = 'Kimberly',
    filename = './speech.mp3', play = false
  }) {
    await this._getAudio({
      Text: Text, VoiceId: VoiceId, filename: filename
    })

    const rpath = path.resolve(filename)
    const audio = new Howl({
      src: `file://${rpath}`,
      autoplay: false,
      loop: false,
      volume: 0.5
    })

    if (play) { audio.play() }
    return audio
  }

  getAudio = (params) => this._getAudio(params)
  async _getAudio ({
    Text = 'test', VoiceId = 'Kimberly',
    filename = 'speech.mp3'
  }) {
    console.log('GETAUIO-START')
    const params = {
      OutputFormat: 'mp3',
      VoiceId: VoiceId,
      Text: Text
    }

    const rpath = path.resolve(filename)
    const fsCallback = (resolve, reject) => {
      Fs.writeFile(rpath, response.AudioStream, (err) => {
        if (err) { return reject(err) }
        return resolve(true)
      })
    }

    const response = await this.synthesize(params)
    console.log('GETAUIO-END')
    if (response.AudioStream instanceof Buffer) {
      await new Promise(fsCallback)
      return response.AudioStream
    } else {
      return false
    }
  }

  getWordMarks = (params) => this._getWordMarks(params)
  async _getWordMarks ({
    Text = 'test', VoiceId = 'Kimberly'
  }) {
    const params = {
      SpeechMarkTypes: ['word'],
      OutputFormat: 'json',
      VoiceId: VoiceId,
      Text: Text
    }

    const response = await this.synthesize(params)
    console.log('RESPONSE', response)
    const buffer = response.AudioStream
    const wordMarks = buffer.toString('utf8')
    // console.log('DONETEXT', wordMarks)
    return wordMarks
  }

  synthesize = (params) => this._synthesize(params)
  _synthesize (params) {
    const self = this
    return new Promise((resolve, reject) => {
      self.polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
          return reject(err)
        } else {
          return resolve(data)
        }
      })
    })
  }

  test = (data) => this._test(data)
  _test () {
    let params = {
      'Text': 'Hi, my name is @anaptfox.',
      'OutputFormat': 'mp3',
      'VoiceId': 'Kimberly'
    }

    this.polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        console.log(err.code)
      } else if (data) {
        if (data.AudioStream instanceof Buffer) {
          Fs.writeFile('./speech.mp3', data.AudioStream, (err) => {
            if (err) { return console.log(err) }
            console.log('The file was saved!')
          })
        }
      }
    })
  }
}

export default new Polly()
