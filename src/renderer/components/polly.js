import { Howl } from 'howler'

const AWS = require('aws-sdk')
// const Stream = require('stream')
// const Speaker = require('speaker')
const path = require('path')
const Fs = require('fs')

class Polly {
  constructor () {
    this.polly = new AWS.Polly({
      signatureVersion: 'v4',
      region: 'us-west-2'
    })
  }

  buildAudio = (params) => this._buildAudio(params)
  async _buildAudio ({
    Text = 'test', VoiceId = 'Kimberly',
    filename = './speech.mp3', play = true
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
