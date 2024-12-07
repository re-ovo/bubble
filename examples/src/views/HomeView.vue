<template>
  <main class="container mx-auto">
    <div class="flex flex-col gap-1 p-4">
      <h1 class="text-blue-600 text-6xl">Bubble</h1>
      <n-alert> 测试 </n-alert>
      <nav>
        <n-list bordered>
          <router-link
            v-for="menu in menus"
            :to="menu.path"
            :key="menu.path"
            class="hover:underline"
          >
            <n-list-item>
              <n-thing :title="menu.name" :description="menu.description" />
            </n-list-item>
          </router-link>
        </n-list>
      </nav>
    </div>
  </main>
</template>

<script setup lang="ts">
interface Menu {
  name: string;
  path: string;
  description: string;
}

const menus: Menu[] = [
  {
    name: 'Test Scene',
    description: '开发测试场景，由于原型开发',
    path: '/test',
  },
];
</script>

<style scoped>
nav li a {
  font-size: 24px;
  @apply decoration-blue-600 hover:underline;
}
</style>
