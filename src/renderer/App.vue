<template>
  <div id="app">
    <div id="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'branspell-electron'
  }
</script>

<style lang="scss">
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

    & > div#content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
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
