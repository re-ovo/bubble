import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/test',
            name: 'test',
            component: () => import('@/views/TestSceneView.vue'),
            meta: {
                title: 'Test Scene',
            }
        },
    ]
})

router.afterEach((to, from) => {
    if (to.meta) {
        document.title = to.meta.title as string || 'Bubble'
    }
})

export default router
