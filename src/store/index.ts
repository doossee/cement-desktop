import { defineStore } from "pinia";
import { User } from "@/utils/types";
import { EXPIRATION_TIME } from "@/utils/constants";

export const useStore = defineStore("app", {
  state: () => ({
    user: null as User | null,
    database: localStorage.getItem('database') as string | null,
  }),
  getters: {
    userData: state => state.user,
    isLogged: () => !!localStorage.getItem("auth"),
    getDatabase: state => state.database || 'database.db',
    getDatabaseType: state => state.database ? state.database.split('_')[0] : 'current'
  },
  actions: {
    login(user: User) {
      const expiresAt = Date.now() + EXPIRATION_TIME;
      this.$patch({ user });
      localStorage.setItem("auth", JSON.stringify({ user, expiresAt }));
    },

    logout() {
      localStorage.removeItem("auth");
    },

    checkAuth() {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        const { user, expiresAt } = JSON.parse(storedAuth);
        if (Date.now() < expiresAt) {
          this.$patch({ user });
        } else {
          this.logout();
        }
      }
    },

    setDatabase(db: string | null) {
      this.$patch({ database: db })
      if(db) {
        localStorage.setItem('database', db)
      } else {
        localStorage.removeItem('database')
      }
    }
  },
});
