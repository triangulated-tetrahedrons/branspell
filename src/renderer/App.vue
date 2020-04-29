<template>
  <div id="app">
    <div id="content">
      <b-tabs type="is-toggle" class="tabs" expanded>
        <b-tab-item label="Spelling"></b-tab-item>
        <b-tab-item label="Statistics"></b-tab-item>
      </b-tabs>
    
      <Tester id="tester"/>

      {{ isOpening }}

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
    </div>
  </div>
</template>

<script>
  import Misc from '@/misc.js'
  import Tester from '@/components/Tester'
  const { dialog } = require('electron').remote

  export default {
    name: 'branspell-electron',

    data: () => ({
      isOpening: false
    }),

    methods: {
      async openFile () {
        this.isOpening = true
        console.log('SET OPENING', this.opening)
        await Misc.sleepAsync(250)
        const filenames = await dialog.showOpenDialog({})
        this.isOpening = false
        console.log('FILENAME', filenames)
        return true
      }
    },

    components: {
      Tester
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

      & > #tester {
        flex-grow: 1;
      }

      & > #open-file {
        width: fit-content;
        position: absolute;
        right: 1rem;
        top: 1rem;
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
