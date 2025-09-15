<template>
  <div class="tooltip-trigger" @mouseenter="show = true" @mouseleave="show = false">
    <slot name="trigger" />
    <div v-if="show" class="tooltip">
      <div class="tooltip-arrow"></div>
      <div class="tooltip-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const show = ref(false)
</script>

<style scoped>
.tooltip-trigger {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  z-index: 1000;
}

.tooltip-content {
  background: #333;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #333;
}
</style>