import { Howl } from 'howler'
import Enum from './Enum.js'

const AWS = require('aws-sdk')
// const Stream = require('stream')
// const Speaker = require('speaker')
const path = require('path')
const Fs = require('fs')

const STATES = new Enum('testing', 'correcting', 'retesting')

class Speech {
  constructor ({
    audio, taudio, wordMarks, duration,
    text, target
  }) {
    this.wordMarks = wordMarks
    this.audio = audio
    this.taudio = taudio
    this.duration = duration

    this.target = target
    this.text = text

    this.startIndex = 0
    this.endIndex = 0
    this.solved = false
  }

  markSolved () {
    this.solved = true
  }

  markUnsolved () {
    this.solved = false
  }

  setSelection (startIndex, endIndex) {
    this.startIndex = startIndex
    this.endIndex = endIndex

    let spriteBegin = 0
    for (let k = 0; k < this.wordMarks.length; k++) {
      const mark = this.wordMarks[k]
      console.log('S-BEGIN', mark, startIndex)
      if (mark.start >= startIndex) {
        spriteBegin = mark.time
        break
      }
    }

    let spriteEnd = this.duration
    console.log('DURATION', this.text, spriteEnd)
    for (let k = this.wordMarks.length - 1; k >= 0; k--) {
      const mark = this.wordMarks[k]
      const prevMark = this.wordMarks[k - 1]

      console.log('S-END', mark, endIndex)
      if (k === 0) {
        spriteEnd = mark.time
        break
      } else if (endIndex >= mark.start) {
        spriteEnd = prevMark.time
        console.log('END-INDEX', prevMark)
        break
      }
    }

    const timings = [spriteBegin, spriteEnd]
    console.log('TIMINGS', timings)
    this.audio._sprite.target = timings
    return timings
  }
}

class WordMark {
  constructor ({
    time, start, end, value, trail
  }) {
    // {"time":2069,"type":"word","start":12,"end":18,"value":"sadsad"}
    this.time = time
    this.start = start
    this.end = end
    this.value = value
    this.trail = trail
  }
}

class Polly {
  static STATES = STATES

  constructor () {
    this.STATES = STATES
    this.polly = new AWS.Polly({
      signatureVersion: 'v4',
      region: 'us-west-2'
    })
  }

  read = (params) => this._read(params)
  async _read ({
    Text = 'test', VoiceId = 'Kimberly',
    filename = './speech.mp3', target = 'potato',
    targetPath = './target.mp3'
  }) {
    const wordMarkPromise = this._getWordMarks({
      Text: Text, VoiceId: VoiceId
    })
    const audioPromise = this._buildAudio({
      Text: Text, VoiceId: VoiceId, filename: filename
    })
    const targetPromise = this._buildAudio({
      Text: target, VoiceId: VoiceId, filename: targetPath
    })

    const [strWordMarks, audio, taudio] = await Promise.all([
      wordMarkPromise, audioPromise, targetPromise
    ])
    const duration = 1000 * await new Promise((resolve) => {
      audio.on('load', () => { resolve(audio.duration()) })
    })

    // console.log('WMARKS', strWordMarks)
    // console.log('DURATION', duration)
    const rawMarks = strWordMarks.split('\n')
    // {"time":2069,"type":"word","start":12,"end":18,"value":"sadsad"}

    const parsedMarks = []
    for (let k = 0; k < rawMarks.length; k++) {
      if (rawMarks[k] === '') { break }
      const parsed = JSON.parse(rawMarks[k])
      parsedMarks.push(parsed)
    }

    const wordMarks = []
    for (let k = 0; k < parsedMarks.length; k++) {
      let bufferIndex = Text.length
      const parsedMark = parsedMarks[k]
      if (k < parsedMarks.length - 1) {
        const nextMark = parsedMarks[k + 1]
        bufferIndex = nextMark['start']
      }

      const endIndex = parsedMark['end']
      const trailingText = Text.slice(endIndex, bufferIndex)
      wordMarks.push(new WordMark({
        time: parsedMark['time'],
        start: parsedMark['start'],
        end: parsedMark['end'],
        value: parsedMark['value'],
        target: target,
        trail: trailingText
      }))
    }

    const speech = new Speech({
      audio: audio,
      taudio: taudio,
      wordMarks: wordMarks,
      duration: duration,
      text: Text,
      target: target
    })

    // console.log('PP', speech)
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
    // console.log('GETAUIO-START')
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
    // console.log('GETAUIO-END')
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
