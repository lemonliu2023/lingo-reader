export default [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/Home.vue'),
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('../pages/Book.vue'),
  },
]
