<template>
  <div id="app">
    <b-loading
      :is-full-page="true"
      :active.sync="isOpening"
      :can-cancel="false"
    > 
      <LoadBar
        class="progress-bar" v-bind:progress="loadProgress"
        v-bind:text="loadStatus"
      />
    </b-loading>

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
        id="tester" v-bind:test="test"
        v-bind:class="{invisible: activeTab !== tabNames.Spelling}"
        @complete='onTestDone' v-bind:done="done"
        @restart='restart'
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
          v-for="(test, index) in tests"
          v-bind:key="index" class="bar"
          v-bind:class="{
            active: isActiveSpeech(test),
            solved: test.solved,
            wrong: test.solved === false
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
  import LoadBar from '@/components/LoadBar'
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
      test: null,
      highscore: 0,
      loadIndex: 0,
      statuses: {},
      tests: [],
      sentences: [],
      tabNames: tabNames,
      activeTabNo: 0,
      stats: []
    }),

    computed: {
      done () {
        return this.incompleteTests.length === 0
      },
      loadProgress () {
        const self = this
        const total = self.sentences.length
        if (total === 0) { return -1 }
        return 100 * self.loadIndex / total
      },

      loadStatus () {
        const self = this
        const total = self.sentences.length
        if (total === 0) { return '' }
        return `${self.loadIndex} / ${total}`
      },

      activeTab () {
        return tabNames.ALL[this.activeTabNo]
      },

      scoreText () {
        const self = this
        if (self.tests.length === 0) {
          return ''
        } else {
          const length = self.tests.length
          return `Highscore : ${self.highscore} / ${length}`
        }
      },

      activeIndex () {
        const self = this
        if (self.tests.length === 0) { return 0 }
        return self.tests.indexOf(self.test)
      },

      incompleteTests () {
        const self = this
        return self.tests.filter(test => {
          return test.solved === null
        })
      },

      score () {
        const self = this
        let score = 0

        for (let k = 0; k < self.tests.length; k++) {
          if (self.tests[k].solved) { score++ }
        }
        return score
      }
    },

    methods: {
      isActiveSpeech (test) {
        return this.test === test
      },

      onTestDone (correct) {
        const self = this

        if (correct) {
          const index = self.activeIndex
          if (self.statuses[index] === undefined) {
            self.statuses[self.activeIndex] = true
          }
        } else {
          self.statuses[self.activeIndex] = false
          // self.restart()
        }

        if (self.incompleteTests.length > 0) {
          self.setRandomTest()
        }
      },

      restart (exclusion) {
        const self = this
        self.highscore = Math.max(self.highscore, self.score)
        self.stats.push(
          self.tests.map(test => test.solved)
        )

        self.tests.map(test => test.markUnset())
        self.statuses = {}
        self.setRandomTest(exclusion)
      },

      async openFile () {
        const self = this
        self.sentences = []
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
        const tests = await self.loadTests(
          dirname, filename
        )

        self.tests = tests
        console.log('TESTS', tests)
        self.setRandomTest()
        self.isOpening = false
        return true
      },

      reset () {
        const self = this
        for (const test of self.tests) {
          test.audio.unload()
        }

        self.highscore = 0
        self.activeTabNo = 0
        self.tests = []
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
        for (let k = 0; k < self.tests.length; k++) {
          const test = self.tests[k]
          if ((test.solved === null) && (test !== exclusion)) {
            unpassed.push(k)
          }
        }

        const index = Misc.randChoice(unpassed)
        self.test = self.tests[index]
        console.log('SET SPEECH', self.test)
        return self.test
      },

      async loadTests (dirname, filename) {
        const self = this
        const data = await self.loadFile(filename)
        if (data === false) { return [] }
        const sentences = data.map((sentence) => {
          console.log('TRIM', sentence)
          return sentence.trim()
        })

        self.sentences = sentences
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

        const tests = await self.textsToTests(
          dirname, sentences
        )

        return tests
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

      async textsToTests (dirname, sentences, tps = 5) {
        const self = this
        self.loadIndex = 0

        const tests = []
        const promiseBatch = []
        const stamp = Math.floor(performance.now() / 1000)

        for (let k = 0; k < sentences.length; k++) {
          let sentence = sentences[k]
          const index = sentences.indexOf(sentence)
          const startIndex = sentence.indexOf('[')
          const endIndex = sentence.indexOf(']') - 1
          sentence = sentence.replace('[', '')
          sentence = sentence.replace(']', '')

          console.log('BLOB', sentence, index, sentences.length)
          const filepath = `${dirname}/sentence-${stamp}-${index}.mp3`
          const targetPath = `${dirname}/target-${stamp}-${index}.mp3`
          const target = sentence.slice(startIndex, endIndex)
          const testPromise = self.getTest(
            sentence, startIndex, endIndex, filepath,
            target, targetPath
          )

          testPromise.then(() => { self.loadIndex++ })
          promiseBatch.push(testPromise)
          const isLastTest = k === sentences.length - 1
          if (isLastTest || promiseBatch.length >= tps) {
            const startTime = performance.now()
            const testBatch = await Promise.all(promiseBatch)
            const endTime = performance.now()
            const duration = 1000 - (endTime - startTime)
            await Misc.sleepAsync(Math.max(10, duration))
            promiseBatch.splice(0, promiseBatch.length)
            tests.push(...testBatch)
          }
        }

        console.log('TESTS', tests)
        return tests
      },

      async getTest (
        sentence, startIndex, endIndex, path = './test.mp3',
        target = 'potato', targetPath = './target.mp3'
      ) {
        // const selection = sentence.slice(startIndex, endIndex)
        const test = await Polly.read({
          Text: sentence,
          filename: path,
          target: target,
          targetPath: targetPath
        })

        test.setSelection(startIndex, endIndex)
        await Misc.sleepAsync(10)
        return test
      }
    },

    watch: {
      score (newscore, oldscore) {
        this.highscore = Math.max(newscore, this.highscore)
      }
    },

    components: {
      Tester, StatsBar, LoadBar
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

    & .progress-bar {
      margin: auto;
      width: 45rem;
      height: fit-content;
    }

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
            &.wrong {
              background-color: #f44034;
            }
          }
          &.solved {
            background-color: #3d71ff;
          }
          &.wrong {
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
