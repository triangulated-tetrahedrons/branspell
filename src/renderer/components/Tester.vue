<template>
  <div class="wrapper">
      <p id="sentence">
        <span
          v-for="(wordMark, index) in wordMarkList"
          v-bind:key="index"
        >
          <span>{{ wordMark['value'] }}</span>
          <span>{{ getBuffer(wordMark) }}</span>
        </span>
      </p>

      <input type="text" v-model="example">
      <div class="buttons">
        <b-button
          id="submit" type="is-primary"
          @click="click" outlined
        >
          Enter Answer
        </b-button>

        {{ position }}
        
        <b-button type="is-primary">
          <font-awesome-icon
            icon="file-audio"
            class="rule-icon large icon alt"
          >
          </font-awesome-icon>
        </b-button>
      </div>
  </div>
</template>

<script>
// Import other required libraries
import Misc from '@/misc.js'
import Polly from './polly'

export default {
  name: 'landing-page',

  components: {},

  data: () => ({
    text: '',
    example: '',
    speeches: {},
    speech: null,
    position: -1,
    isDestroyed: false
  }),

  computed: {
    wordMarkList () {
      if (this.speech === null) { return [] }
      return this.speech.wordMarks
    }
  },

  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },

    updatePosition () {
      if (this.speech === null) { return }
      const audio = this.speech.audio
      this.position = audio.pos()
    },

    getBuffer (wordMark) {
      // {"time":107,"type":"word","start":12,"end":17,"value":"dsdas"}
      const index = this.wordMarkList.indexOf(wordMark)
      const strIndex = wordMark['end']

      const numWordMarks = this.wordMarkList.length
      const lastWordMark = this.wordMarkList[numWordMarks - 1]
      let nextStrIndex = lastWordMark['end']

      if (index < numWordMarks - 1) {
        const nextWordMark = this.wordMarkList[index + 1]
        nextStrIndex = nextWordMark['start']
      }

      return this.text.slice(strIndex, nextStrIndex)
    },

    async click () {
      const self = this
      const text = 'hello, world!'

      try {
        const speech = await Polly.read({
          Text: self.example
        })

        console.log('SPEECH', speech)
        self.speeches[speech.text] = speech
        self.speech = speech
      } catch (err) {
        self.error = err.stack
        console.log(err)
      }

      console.log(text)
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
        await Misc.sleepAsync(250)
      }
    })()
  }
}
</script>

<style lang="scss" scoped>
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

      & > p#sentence {
        white-space: pre-line;
        display: flex;

        & > span {
          width: fit-content;
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
