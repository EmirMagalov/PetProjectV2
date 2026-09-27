import '../assets/main.css'
import {createWebHistory, createRouter} from 'vue-router'
import PetMain from "@/components/PetMain.vue";
import SaloonMain from "@/components/Saloon/SaloonMain.vue";
import {createApp} from 'vue'
import App from '../App.vue'

const routes = [
    {path: '/', component: PetMain},
    {path: '/saloon', component: SaloonMain},
]
export const router = createRouter({
    history: createWebHistory(),
    routes,
})


const app = createApp(App)
app.use(router)
app.mount('#app')



