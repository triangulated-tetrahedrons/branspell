<template>
  <div
    class="progress-bar"
    v-bind:class="{invisible: progress === -1}"
  >
    <div class="wrapper">
      <div
        v-bind:style="{width: progress + '%'}"
        class="content"
      />
    </div>
    <p class="text">{{ text }}</p>
  </div>
</template>

<script>
// Import other required libraries
import Misc from '@/misc.js'
import Polly from '@/components/polly'

const STATES = Polly.STATES
console.log(STATES, Misc, Polly)

export default {
  name: 'stats',
  props: {
    progress: {
      default: 0,
      type: Number
    },

    text: {
      default: '',
      type: String
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "@/assets/scss/vars.scss";
  .invisible {
    display: none;
  }

  div.progress-bar {
    z-index: 20;

    & > .wrapper {
      width: 100%;
      height: 2rem;
      background-color: #DDD;
      border-radius: 3px;
      & > div.content {
        background-color: #3d71ff;
        height: 100%;
        margin: 0px;
        border-radius: 3px;
        transition: 1s;
      }
    }

    & > .text {
      display: relative;
      margin-top: 0.5rem;
      font-size: 1.5rem;
      color: #333;
      font-family: 'Open Sans';
      /* margin-left: auto; */
      text-align: center;
    }
  }
</style>
