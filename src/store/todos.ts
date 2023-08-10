import axios from "axios";
import { defineStore } from "pinia";

export type Todos = Todo[]; // 할 일 목록

export interface Todo {
  id: string; // 할 일 ID
  order: number; // 할 일 순서
  title: string; // 할 일 제목
  done: boolean; // 할 일 완료 여부
  createdAt: string; // 할 일 생성일
  updatedAt: string; // 할 일 수정일
}

type FilterStatus = "all" | "todo" | "done";
type Filters = Filter[];
interface Filter {
  label: string;
  name: FilterStatus;
}

interface CreateTodoPayload {
  title: string;
}

interface DeleteTodoPayload {
  id: string;
}

interface ReorderTodosPayload {
  oldIndex: number;
  newIndex: number;
}

const filters: Filters = [
  { label: "전체", name: "all" },
  { label: "할 일만", name: "todo" },
  { label: "완료만", name: "done" },
];

const currentTodo: Todo = {
  id: "",
  order: 0,
  title: "",
  done: false,
  createdAt: "",
  updatedAt: "",
};

export const useTodosStore = defineStore("todos", {
  state: () => ({
    todos: [] as Todos,
    filterStatus: "all" as FilterStatus,
    filters,
    currentTodo,
    loading: false,
  }),
  getters: {
    filteredTodos(state) {
      return state.todos.filter((todo) => {
        switch (state.filterStatus) {
          case "todo":
            return !todo.done;
          case "done":
            return todo.done;
          default:
            return true;
        }
      });
    },
  },
  actions: {
    async fetchTodos() {
      if (this.loading) return;
      this.loading = true;

      try {
        const { data } = await axios.post("/api/todos", {
          method: "GET",
        });
        this.todos = data;
      } catch (e) {
        console.error("fetchTodos:", e);
      } finally {
        this.loading = false;
      }
    },

    async createTodo({ title }: CreateTodoPayload) {
      if (this.loading) return;
      this.loading = true;

      try {
        const { data: createdTodo } = await axios.post("/api/todos", {
          method: "POST",
          data: {
            title,
          },
        });
        this.todos.unshift(createdTodo);
      } catch (e) {
        console.error("createTodo:", e);
      } finally {
        this.loading = false;
      }
    },

    async updateTodo(todo: Todo) {
      const foundTodo = this.todos.find((t) => t.id === todo.id);
      if (!foundTodo) return;
      const backedUpTodo = { ...foundTodo };
      Object.assign(foundTodo, todo);

      try {
        const { id: path, title, done } = todo;
        const { data: updatedTodo } = await axios.post("/api/todos", {
          method: "PUT",
          path,
          data: {
            title,
            done,
          },
        });

        foundTodo.updatedAt = updatedTodo.updatedAt;
      } catch (e) {
        console.error("updateTodo:", e);
        Object.assign(foundTodo, backedUpTodo);
      }
    },

    updateCheckboxes(done: boolean) {
      this.todos.forEach((todo) => {
        this.updateTodo({
          ...todo,
          done,
        });
      });
    },

    async deleteTodo({ id }: DeleteTodoPayload) {
      try {
        await axios.post("/api/todos", {
          method: "DELETE",
          path: id,
        });

        this.todos = this.todos.filter((todo) => todo.id !== id);
      } catch (e) {
        console.error("deleteTodo:", e);
      }
    },

    async deleteDoneTodos() {
      const todoIds = this.todos
        .filter((todo) => todo.done)
        .map((todo) => todo.id);

      if (!todoIds.length) return;
      if (this.loading) return;
      this.loading = true;

      try {
        await axios.post("/api/todos", {
          method: "DELETE",
          path: "deletions",
          data: {
            todoIds,
          },
        });

        this.todos = this.todos.filter((todo) => !todoIds.includes(todo.id));
      } catch (e) {
        console.error("deleteDoneTodos:", e);
      } finally {
        this.loading = false;
      }
    },

    async reorderTodos({ oldIndex, newIndex }: ReorderTodosPayload) {
      if (oldIndex === newIndex) return;
      if (this.loading) return;
      this.loading = true;

      const movedTodo = this.todos.splice(oldIndex, 1)[0];
      this.todos.splice(newIndex, 0, movedTodo);

      const todoIds = this.todos.map((todo) => todo.id);

      try {
        await axios.post("/api/todos", {
          method: "PUT",
          path: "reorder",
          data: {
            todoIds,
          },
        });
      } catch (e) {
        console.error("reorderTodos:", e);
      } finally {
        this.loading = false;
      }
    },
  },
});
