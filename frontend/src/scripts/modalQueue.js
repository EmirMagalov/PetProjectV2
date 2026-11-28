import { ref } from 'vue'

export const activeModal = ref(null)
const modalQueue = ref([])

export function requestModal(name) {
    if (!name) return
    if (activeModal.value === name || modalQueue.value.includes(name)) return

    if (!activeModal.value) {
        activeModal.value = name
    } else {
        modalQueue.value.push(name)
    }
}

export function releaseModal(name) {
    if (name && activeModal.value && activeModal.value !== name) {
        modalQueue.value = modalQueue.value.filter((item) => item !== name)
        return
    }

    activeModal.value = modalQueue.value.shift() || null
}