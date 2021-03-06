<template>
  <div class="wrapper">
      <!--<p> {{ position }} </p>-->
      <p id="sentence">
        <span
          v-for="(wordMark, index) in wordMarkList"
          v-bind:key="index" class="word-mark"
        >
          <span
            v-bind:class = "{
              active: isActiveWordMark(wordMark),
              playing: isPlaying(index)
            }"
            class="word"
          >{{ showIf(wordMark) }}</span>
          <span class="trail">{{ wordMark.trail }}</span>
        </span>
      </p>

      <!-- {{ target }} - {{ answer }} -->

      <input type="text" v-model="answer">

      <div class="buttons">
        <b-button
          id="reset" type="is-primary"
          outlined :disabled="disabled"
          @click="restart"
        >
          Restart
        </b-button>

        <div class="buffer"></div>

        <b-button
          id="submit" :type="submitButtonType"
          @click="submit" outlined
          :disabled="done || disabled || invalidAnswer"
        >
          Enter Answer
        </b-button>
        
        <b-button
          type="is-success" @click="playSprite" outlined
          :disabled="done || disabled"
        >
          Answer 🔊
        </b-button>

        <b-button
          type="is-info" @click="playTarget" outlined
          :disabled="done || disabled"
        >
          Sentence 🔊
        </b-button>
      </div>
  </div>
</template>

<script>
// Import other required libraries
import Misc from '@/misc.js'
import Polly from '@/components/polly'

const STATES = Polly.STATES

export default {
  name: 'landing-page',

  components: {},

  data: () => ({
    answer: '',
    position: -1,
    isDestroyed: false,
    state: STATES.testing
  }),

  computed: {
    taudio () {
      if (this.test === null) { return null }
      return this.test.taudio
    },
    audio () {
      if (this.test === null) { return null }
      return this.test.audio
    },
    wordMarkList () {
      if (this.test === null) { return [] }
      return this.test.wordMarks
    },
    disabled () {
      if (this.test === null) {
        return true
      } else {
        return (
          this.test.audio.playing() ||
          this.test.taudio.playing()
        )
      }
    },

    submitButtonType () {
      const self = this
      if (self.state === STATES.correcting) {
        return 'is-danger'
      } else if (self.state === STATES.retesting) {
        return 'is-warning'
      } else {
        return 'is-primary'
      }
    },

    filteredAnswer () {
      const self = this
      let answer = self.answer.trim().toLowerCase()
      answer = answer.replace(/\s+/gm, ' ')
      return answer
    },

    target () {
      const self = this
      if (self.test === null) { return false }
      return self.test.target.trim().toLowerCase()
    },

    isAnswerCorrect () {
      const self = this
      if (self.test === null) { return false }
      const target = self.target
      return self.filteredAnswer === target
    },

    invalidAnswer () {
      const self = this
      if (self.test === null) { return true }
      const isCorrecting = self.state === STATES.correcting

      if (self.answer.trim() === '') {
        return true
      } else if (isCorrecting && !self.isAnswerCorrect) {
        return true
      } else {
        return false
      }
    }
  },

  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },

    restart () {
      this.answer = ''
      this.$emit('restart', this.test)
    },

    playTarget () {
      if (this.test === null) { return [] }
      this.audio.play()
    },

    playSprite () {
      if (this.test === null) { return [] }
      this.taudio.play()
    },

    isPlaying (index) {
      if (this.test === null) { return false }

      const wordMarks = this.test.wordMarks
      const start = wordMarks[index].time / 1000

      let end = this.test.duration
      if (index < wordMarks.length - 1) {
        end = wordMarks[index + 1].time / 1000
      }

      const position = this.position
      if ((end > position) && (position > start)) {
        return true
      }

      return false
    },

    updatePosition () {
      // console.log('UPDATING')
      if (this.test === null) { return }
      if (!this.test.audio.playing()) {
        this.position = 0
        return
      }

      const audio = this.test.audio
      this.position = audio.seek()
    },

    showIf (wordMark) {
      const isActiveWordMark = this.isActiveWordMark(wordMark)
      if (!isActiveWordMark || (this.state === STATES.correcting)) {
        return wordMark.value
      } else {
        return '[—]'
      }
    },

    isActiveWordMark (wordMark) {
      if (this.test === null) { return '' }
      const startIndex = this.test.startIndex
      const endIndex = this.test.endIndex
      return (
        (endIndex >= wordMark.end) &&
        (wordMark.start >= startIndex)
      )
    },

    submit () {
      if (this.test === null) { return }
      const self = this

      self.answer = self.filteredAnswer

      if (self.state === STATES.correcting) {
        Misc.assert(self.isAnswerCorrect)
        self.state = STATES.retesting
        self.test.audio.play()
      } else if (!self.isAnswerCorrect) {
        self.state = STATES.correcting
        self.test.markUnsolved()
        self.test.audio.play()
      } else if (self.state === STATES.testing) {
        Misc.assert(self.isAnswerCorrect)
        self.test.markSolved()
        self.$emit('complete', true)
      } else {
        Misc.assert(self.state === STATES.retesting)
        Misc.assert(self.isAnswerCorrect)
        self.$emit('complete', false)
      }

      self.answer = ''
      console.log('blub')
    }
  },

  beforeDestroy () {
    this.isDestroyed = true
  },

  async created () {
    const self = this;
    // console.log('POLLY')

    (async () => {
      while (!self.isDestroyed) {
        self.updatePosition()
        await Misc.sleepAsync(100)
      }
    })()
  },

  watch: {
    test (newTest, oldTest) {
      console.log('SPEECH-LOAD', newTest)
      this.state = STATES.testing
      newTest.audio.play()
    }
  },

  props: {
    test: {
      default: null,
      type: Polly.Test
    },
    done: {
      default: false,
      type: Boolean
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "@/assets/scss/vars.scss";

  div.wrapper {
    padding: 0;
    margin: 0;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    & > div.buttons {
      margin: 1rem;
      display: flex;
      width: 40rem;

      & > div.buffer {
        flex-grow: 1;
      }

      & > p#sentence {
        white-space: pre-line;
        display: flex;

        & > span {
          width: fit-content;
        }
      }
    }

    & > p#sentence {
      display: flex;
      font-size: 2rem;
      margin-bottom: 1rem;
      margin-left: 1rem;
      margin-right: 1rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;

      & > span.word-mark {
        display: flex;
        & > * {
          white-space: pre;
          font-size: 1.5rem;
        }

        & span.active {
          font-family: 'Ubuntu Mono';
          color: #ff9b5d;
        }
        & span.playing {
          text-decoration: underline;
        }
      }
    }
  }

  body { font-family: 'Ubuntu Mono', sans-serif; }

  input {
    font-size: 1.4rem;
    width: 50rem;
    text-align: center;
    border: 0px solid #CCC;
    border-bottom: 2px solid #CCC;
    border-radius: 0px;
    font-family: 'Ubuntu Mono';
    font-weight: 700;
    color: #666;
  }
</style>
