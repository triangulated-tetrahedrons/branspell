<template>
  <div id="wrapper">
      <input type="text">
      <b-button @click="click">Click Me</b-button>
      <br/>
      <p>{{ error }}</p>
  </div>
</template>

<script>
// Import other required libraries
import Polly from './polly'

export default {
  name: 'landing-page',
  components: {},
  data: () => ({
    error: 'test'
  }),
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },

    async click () {
      const self = this
      const text = 'hello, world!'

      try {
        await Polly.buildAudio({})
        // throw new Error('potao')
      } catch (err) {
        self.error = err.stack
        console.log(err)
      }

      console.log(text)
    }
  },

  async created () {
    console.log('POLLY')
  }
}
</script>

<style lang="scss" scoped>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  div#wrapper {
    height: 100%;
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

    & > p {
      white-space: pre-line
    }
  }

  body { font-family: 'Ubuntu Mono', sans-serif; }

  input {
    font-size: 2rem;
    border: 0px solid #555;
    border-bottom: 2px solid #555;
    border-radius: 0px;
    font-family: 'Ubuntu Mono';
    font-weight: 700;
    color: #666;
  }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 420px;
  }

  main {
    display: flex;
    justify-content: space-between;
  }

  main > div { flex-basis: 50%; }

  .left-side {
    display: flex;
    flex-direction: column;
  }

  .welcome {
    color: #555;
    font-size: 23px;
    margin-bottom: 10px;
  }

  .title {
    color: #2c3e50;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .title.alt {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .doc p {
    color: black;
    margin-bottom: 10px;
  }

  .doc button {
    font-size: .8em;
    cursor: pointer;
    outline: none;
    padding: 0.75em 2em;
    border-radius: 2em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }
</style>
