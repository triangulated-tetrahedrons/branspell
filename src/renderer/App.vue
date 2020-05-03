<template>
  <div id="app">
    <div id="content">
      <b-tabs
        v-model='activeTabNo' type="is-toggle"
        v-bind:class="{invisible: stats.length === 0}"
        class="tabs" expanded
      >
        <b-tab-item
          v-for="(tabName, index) in tabNames.ALL"
          v-bind:key="index" :label="tabName">
        </b-tab-item>
      </b-tabs>
    
      <Tester
        id="tester" v-bind:speech="speech"
        v-bind:class="{invisible: activeTab !== tabNames.Spelling}"
        @complete='onTestDone'
      />

      <StatsBar
        id="statistics" v-bind:stats="stats"
        v-bind:class="{invisible: activeTab !== tabNames.Statistics}"
      />

      <b-button
        id="open-file" type="is-primary"
        :disabled="isOpening"
        @click="openFile()"
      >
        <font-awesome-icon
          icon="file-import"
          class="rule-icon large icon alt"
        ></font-awesome-icon>
      </b-button>

      <p class='score'> {{ scoreText }} </p>

      <div class="status-bars">
        <div
          v-for="(speech, index) in speeches"
          v-bind:key="index" class="bar"
          v-bind:class="{
            active: isActiveSpeech(speech),
            solved: speech.solved
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
  import Misc from '@/misc.js'
  import Tester from '@/components/Tester'
  import StatsBar from '@/components/StatsBar'
  import Polly from '@/components/polly'
  import { ToastProgrammatic as Toast } from 'buefy'
  import Enum from '@/components/Enum.js'

  const { dialog } = require('electron').remote
  const yaml = require('js-yaml')
  const path = require('path')
  const FS = require('fs')

  // const STATES = Polly.STATES
  const tabNames = Enum('Spelling', 'Statistics')

  export default {
    name: 'branspell-electron',

    data: () => ({
      isOpening: false,
      speech: null,
      highscore: 0,
      statuses: {},
      speeches: [],
      tabNames: tabNames,
      activeTabNo: 0,
      stats: [[true, true, true], [true, true, true], [true, true, false], [true, true, true], [true, true, true]]
    }),

    computed: {
      activeTab () {
        return tabNames.ALL[this.activeTabNo]
      },

      scoreText () {
        const self = this
        if (self.speeches.length === 0) {
          return ''
        } else {
          const length = self.speeches.length
          return `Highscore : ${self.highscore} / ${length}`
        }
      },

      activeIndex () {
        const self = this
        if (self.speeches.length === 0) { return 0 }
        return self.speeches.indexOf(self.speech)
      },

      unsolvedTests () {
        const self = this
        return self.speeches.filter(speech => {
          return !speech.solved
        })
      },

      score () {
        const self = this
        let score = 0

        for (let k = 0; k < self.speeches.length; k++) {
          if (self.speeches[k].solved) { score++ }
        }
        return score
      }
    },

    methods: {
      isActiveSpeech (speech) {
        return this.speech === speech
      },

      onTestDone (correct) {
        const self = this

        if (correct) {
          self.speech.markSolved()
          const index = self.activeIndex
          if (self.statuses[index] === undefined) {
            self.statuses[self.activeIndex] = true
          }
        } else {
          self.statuses[self.activeIndex] = false
          self.restart()
        }

        if (self.unsolvedTests.length === 0) {
          self.restart(self.speech)
        } else {
          self.setRandomTest()
        }
      },

      restart (exclusion) {
        const self = this
        self.highscore = Math.max(self.highscore, self.score)
        self.speeches.map(speech => speech.markUnsolved())

        self.stats.push(
          self.speeches.map((key, index) => {
            if (self.statuses[index] !== undefined) {
              return self.statuses[index]
            } else {
              return false
            }
          })
        )

        self.statuses = {}
        self.setRandomTest(exclusion)
      },

      async openFile () {
        const self = this
        self.isOpening = true
        // console.log('SET OPENING', this.opening)
        await Misc.sleepAsync(250)
        const filenames = await dialog.showOpenDialog({})
        if (filenames === undefined) {
          self.isOpening = false
          return false
        }

        self.reset()
        const dirname = './audios'
        await self.mkdir(dirname)
        await Misc.sleepAsync(100)
        await self.clearAudios(dirname)
        await Misc.sleepAsync(250)
        console.log('FILENAME', filenames)
        const filename = filenames[0]
        const speeches = await self.loadTests(
          dirname, filename
        )

        self.speeches = speeches
        console.log('SPEECHES', speeches)
        self.setRandomTest()
        self.isOpening = false
        return true
      },

      reset () {
        const self = this
        for (const speech of self.speeches) {
          speech.audio.unload()
        }

        self.highscore = 0
        self.activeTabNo = 0
        self.speeches = []
        self.statuses = {}
        self.stats = []
      },

      mkdir (dirname) {
        return new Promise((resolve, reject) => {
          console.log('MKDIR', dirname)
          FS.mkdir(dirname, () => {
            console.log('DONE MKDIR')
            return resolve(true)
          })
        })
      },

      clearAudios (dirname) {
        const self = this
        return new Promise((resolve, reject) => {
          FS.readdir(dirname, async (err, files) => {
            if (err) { throw err }
            if (files.length === 0) {
              return resolve(true)
            }

            for (let k = 0; k < files.length; k++) {
              const file = files[k]
              const filepath = path.join(dirname, file)
              await self.deleteFile(filepath)
            }

            return resolve(true)
          })
        })
      },

      deleteFile (filepath) {
        return new Promise((resolve, reject) => {
          FS.unlink(filepath, err => {
            if (err) { return reject(err) }
            return resolve(true)
          })
        })
      },

      setRandomTest (exclusion) {
        const self = this
        const unpassed = []
        for (let k = 0; k < self.speeches.length; k++) {
          const speech = self.speeches[k]
          if (!speech.solved && (speech !== exclusion)) {
            unpassed.push(k)
          }
        }

        const index = Misc.randChoice(unpassed)
        self.speech = self.speeches[index]
        console.log('SET SPEECH', self.speech)
        return self.speech
      },

      async loadTests (dirname, filename) {
        const self = this
        const data = await self.loadFile(filename)
        if (data === false) { return [] }
        const sentences = data.map((sentence) => {
          console.log('TRIM', sentence)
          return sentence.trim()
        })

        const regex = /^[^[\]]*(\[[^[\]]+\])[^[\]]*$/
        // e.g. Joel created a [potato] using his magic wand.

        console.log('YAML', data)
        for (let sentence of sentences) {
          sentence = sentence.trim()
          sentence = sentence.replace(/\s+/gm, ' ')

          const matches = regex.test(sentence)
          if (matches === null) {
            Toast.open(`Invalid sentence ${sentence}`)
            console.log('FAILED STENCE', sentence)
            return []
          }
        }

        const speeches = await self.textsToTests(
          dirname, sentences
        )
        return speeches
      },

      async loadFile (filename) {
        let fileData

        try {
          fileData = await new Promise((resolve, reject) => {
            FS.readFile(filename, 'utf-8', (err, data) => {
              if (err) { return reject(err) }
              return resolve(data)
            })
          })
        } catch (e) {
          Toast.open(`Error opening ${filename}`)
          console.log(e)
          return false
        }

        console.log('FILE LOADED', fileData)
        let yamlData

        try {
          yamlData = yaml.safeLoad(fileData)
        } catch (e) {
          Toast.open(`Error parsing ${filename}`)
          console.log(e)
          return false
        }

        const data = yamlData['data']
        if (data === undefined) {
          Toast.open(`YAML has no attribute 'data'`)
          return false
        }

        return data
      },

      async textsToTests (dirname, sentences) {
        const self = this

        const promises = sentences.map((sentence) => {
          const index = sentences.indexOf(sentence)
          const startIndex = sentence.indexOf('[')
          const endIndex = sentence.indexOf(']') - 1
          sentence = sentence.replace('[', '')
          sentence = sentence.replace(']', '')

          console.log('BLOB', sentence, index, sentences.length)
          const filepath = `${dirname}/sentence-${index}.mp3`
          const targetPath = `${dirname}/target--${index}.mp3`
          const target = sentence.slice(startIndex, endIndex)

          return self.getTest(
            sentence, startIndex, endIndex, filepath,
            target, targetPath
          )
        })

        const speeches = await Promise.all(promises)
        console.log('END READFILE')
        return speeches
      },

      getTest (
        sentence, startIndex, endIndex, path = './test.mp3',
        target = 'potato', targetPath = './target.mp3'
      ) {
        // const selection = sentence.slice(startIndex, endIndex)
        return new Promise(resolve => {
          // console.log('SPEECHY', sentence, selection, Polly)
          Polly.read({
            Text: sentence,
            filename: path,
            target: target,
            targetPath: targetPath
          }).then(speech => {
            speech.setSelection(startIndex, endIndex)
            resolve(speech)
          })
        })
      }
    },

    components: {
      Tester, StatsBar
    }
  }
</script>

<style lang="scss">
  // Import Bulma's core
  @import "~bulma/sass/utilities/_all";
  @import "@/assets/scss/vars.scss";
  // Setup $colors to use as bulsma classes (e.g. 'is-twitter')
  $colors: (
    "white": ($white, $black),
    "black": ($black, $white),
    "light": ($light, $light-invert),
    "dark": ($dark, $dark-invert),
    "primary": ($primary, $primary-invert),
    "info": ($info, $info-invert),
    "success": ($success, $success-invert),
    "warning": ($warning, $warning-invert),
    "danger": ($danger, $danger-invert),
    "twitter": ($twitter, $twitter-invert)
  );

  // Import Bulma and Buefy styles
  @import "~bulma";
  @import "~buefy/src/scss/buefy";

  @font-face {
    font-family: "Open Sans";
    src:
      url("./assets/fonts/OpenSans-Regular.ttf") format("truetype");
      /* Add other formats as you see fit */
  }

  /* CSS */
  @font-face {
    font-family: "Staatliches";
    src:
      url("./assets/fonts/Staatliches-Regular.ttf") format("truetype");
      /* Add other formats as you see fit */
  }

  @font-face {
    font-family: "Ubuntu Mono";
    src:
      url("./assets/fonts/UbuntuMono-R.ttf") format("truetype");
      /* Add other formats as you see fit */
  }

  @font-face {
    font-family: "Inconsolata";
    src:
      url("./assets/fonts/Inconsolata-Regular.ttf") format("truetype");
      /* Add other formats as you see fit */
  }

  @font-face {
    font-family: "Abel";
    src:
      url("./assets/fonts/Abel-Regular.ttf") format("truetype");
      /* Add other formats as you see fit */
  }

  html {
    overflow-y: auto !important;
  }

  input {
    padding: 0.5rem;
  }
  input:focus, textarea:focus, select:focus{
    outline: none;
  }

  .invisible {
    display: none !important;
  }

  div#app {
    width: 100%;
    height: 100%;

    & .b-tabs .tab-content {
      padding: 0px;
    }

    & > div#content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;

      & > .tabs {
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
        margin-top: 2rem;
      }

      & p.score {
        text-align: center;
        margin-bottom: 1rem;
      }

      & > #tester, #statistics {
        flex-grow: 1;
      }

      & > #open-file {
        width: fit-content;
        position: absolute;
        right: 1rem;
        top: 1rem;
      }

      & > div.status-bars {
        height: 0.5rem;
        flex-direction: row;
        align-items: flex-end;
        display: flex;

        & > div.bar {
          height: 80%;
          flex-grow: 1;
          background-color: #DDD;
          margin-left: 0.4rem;

          &:nth-child(1) {
            margin-left: 0px
          }
          &.active {
            background-color: #6db440;
            height: 100%;
          }
          &.solved {
            background-color: #3d71ff;
          }
          &.failed {
            background-color: #ff9b5d;
          }
        }
      }
    }
  }

  * {
    font-family: 'Open Sans';
    box-sizing: border-box;
    font-size: 1rem;
    margin: 0;
    padding: 0;
  }

  ::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 0px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 0px;
    background-color: #EEE; /* #475669 */
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #BBB; /*#475669; */
  }
  ::-webkit-scrollbar-thumb:active {
    background-color: #475669; /*#475669; */
  }
</style>
