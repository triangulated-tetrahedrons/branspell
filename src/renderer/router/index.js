import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'tester',
      component: require('@/components/Tester').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
