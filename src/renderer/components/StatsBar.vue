<template>
  <div class="stats-wrapper">
    <div
      v-for="(statbar, index) in stats"
      v-bind:key="index"
      class="holder"
    >
      <div
        v-for="(correct, column) in statbar"
        v-bind:key="column"
        v-bind:class="{correct: correct}"
        class="bar"
      ></div>
    </div>
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
    stats: {
      default: null,
      type: null
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "@/assets/scss/vars.scss";
  div.stats-wrapper {
    display: flex;
    margin-bottom: 1rem;
    flex-direction: column;
    flex-shrink: 1;

    & > div.holder {
      display: flex;
      height: 0.3rem;
      margin-left: 1rem;
      margin-right: 1rem;
      margin-top: 0.4rem;
      flex-direction: row;
      flex-shrink: 1;
      flex-grow: 1;

      &:nth-child(1) {
        margin-top: 0px
      }

      & > div.bar {
        background-color: #ff9b5d;
        margin-left: 0.4rem;
        flex-shrink: 1;
        flex-grow: 1;

        &:nth-child(1) {
          margin-left: 0px
        }
        &.correct {
          background-color: #3d71ff;
        }
      }
    }
  }
</style>
