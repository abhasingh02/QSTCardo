const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/',
        redirect: '/login',
      },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      {
        path: 'home',
        component: () => import('src/pages/FlashcardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'flashcard/:id',
        component: () => import('src/pages/FlashcardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'shopping',
        component: () => import('src/pages/ShoppingPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]

export default routes
