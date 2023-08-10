<script setup lang="ts">
import { ref } from "vue";
import TheIcon from "~/components/TheIcon.vue";
import { useTodosStore } from "~/store/todos";
import TheLoader from "./TheLoader.vue";

const todosStore = useTodosStore();
const title = ref("");

async function createTodo(e: MouseEvent | KeyboardEvent) {
  if (e instanceof KeyboardEvent && e.isComposing) return;
  if (!title.value.trim()) return;

  try {
    await todosStore.createTodo({
      title: title.value,
    });
    title.value = "";
  } catch (e) {
    console.error("TodoCreator/createTodo", e);
  }
}
</script>

<template>
  <div class="todo-creator shadow">
    <TheLoader v-if="todosStore.loading" />
    <TheIcon
      v-else
      active
      @click="createTodo">
      add
    </TheIcon>
    <input
      :value="title"
      placeholder="새로운 할 일을 작성하세요.."
      @input="title = ($event.target as HTMLInputElement).value"
      @keydown.enter="createTodo" />
  </div>
</template>

<style lang="scss" scoped>
.todo-creator {
  height: var(--item-height);
  position: relative;
  margin-bottom: 30px;

  :deep(.the-loader),
  :deep(.the-icon) {
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
    left: 24px;
    z-index: 1;
  }

  input {
    padding: 0 10px 0 80px;
    border: none;
    outline: none;
    border-radius: 6px;
    background-color: #fff;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    &::placeholder {
      color: #ccc;
    }
  }
}
</style>
