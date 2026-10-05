<template>
  <div class="space-y-2">
    <!-- Tag Chips Box -->
    <div
      class="min-h-[44px] p-2 bg-white rounded-xl border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 transition-all flex flex-wrap items-center gap-1.5 cursor-text"
      @click="focusInput"
    >
      <!-- Tag Chips -->
      <span
        v-for="(tag, index) in tagList"
        :key="tag"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs"
      >
        <span class="capitalize">{{ tag }}</span>
        <button
          type="button"
          class="w-3.5 h-3.5 rounded-full hover:bg-purple-200 text-purple-500 hover:text-purple-800 flex items-center justify-center transition-colors"
          title="Remove location"
          @click.stop="removeTag(index)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </button>
      </span>

      <!-- Input Field -->
      <div class="flex-1 flex items-center min-w-[150px] gap-1">
        <input
          ref="inputRef"
          v-model="newLocation"
          type="text"
          :placeholder="tagList.length === 0 ? placeholder : 'Add more...'"
          class="w-full bg-transparent text-xs text-gray-900 border-none outline-none p-1 focus:ring-0 placeholder:text-gray-400"
          @keydown.enter.prevent="addCurrent"
          @keydown="handleKeyDown"
          @paste="handlePaste"
          @blur="addCurrent"
        />

        <button
          v-if="newLocation.trim()"
          type="button"
          class="shrink-0 px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
          @mousedown.prevent="addCurrent"
        >
          <UIcon name="i-heroicons-plus" class="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>
    </div>

    <!-- Quick Suggestions & Info Footer -->
    <div class="flex items-center justify-between gap-2 flex-wrap text-[11px]">
      <div class="flex items-center flex-wrap gap-1.5">
        <span class="text-gray-400 text-[10px] font-medium">Quick Suggestions:</span>
        <button
          v-for="sug in quickSuggestions"
          :key="sug"
          type="button"
          :disabled="isTagAdded(sug)"
          class="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
          :class="[
            isTagAdded(sug)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 cursor-pointer active:scale-95'
          ]"
          @click.stop="addTag(sug)"
        >
          + {{ sug }}
        </button>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <span v-if="tagList.length > 0" class="text-gray-500 text-[10px] font-medium">
          {{ tagList.length }} {{ tagList.length === 1 ? 'area' : 'areas' }} added
        </span>
        <button
          v-if="tagList.length > 0"
          type="button"
          class="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline"
          @click.stop="clearAll"
        >
          Clear all
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    quickSuggestions?: string[];
  }>(),
  {
    modelValue: "",
    placeholder: "Type city or locality and press Enter or comma...",
    quickSuggestions: () => ["Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad", "Mumbai", "Bengaluru"],
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const newLocation = ref("");

// Parse comma/newline-separated modelValue into an array of clean string tags
function parseTags(val: string | null | undefined): string[] {
  if (!val) return [];
  return val
    .split(/[\n,]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item, idx, self) => item.length > 0 && self.indexOf(item) === idx);
}

const tagList = ref<string[]>(parseTags(props.modelValue));

// Keep tagList in sync if modelValue changes externally (e.g. selecting different employee)
watch(
  () => props.modelValue,
  (newVal) => {
    const parsed = parseTags(newVal);
    if (parsed.join(",") !== tagList.value.join(",")) {
      tagList.value = parsed;
    }
  }
);

function syncModel() {
  emit("update:modelValue", tagList.value.join(", "));
}

function focusInput() {
  inputRef.value?.focus();
}

function isTagAdded(tag: string): boolean {
  return tagList.value.includes(tag.trim().toLowerCase());
}

function addTag(tag: string) {
  const clean = tag.trim().toLowerCase();
  if (clean && !tagList.value.includes(clean)) {
    tagList.value.push(clean);
    syncModel();
  }
}

function addCurrent() {
  const raw = newLocation.value.trim();
  if (!raw) return;

  // Split in case the user typed or pasted multiple items
  const items = raw.split(/[\n,]+/);
  let addedAny = false;

  for (const item of items) {
    const clean = item.trim().toLowerCase();
    if (clean && !tagList.value.includes(clean)) {
      tagList.value.push(clean);
      addedAny = true;
    }
  }

  newLocation.value = "";
  if (addedAny) {
    syncModel();
  }
}

function removeTag(index: number) {
  tagList.value.splice(index, 1);
  syncModel();
}

function clearAll() {
  tagList.value = [];
  newLocation.value = "";
  syncModel();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === ",") {
    e.preventDefault();
    addCurrent();
  } else if (e.key === "Backspace" && !newLocation.value && tagList.value.length > 0) {
    removeTag(tagList.value.length - 1);
  }
}

function handlePaste(e: ClipboardEvent) {
  const pasteData = e.clipboardData?.getData("text");
  if (!pasteData) return;

  // If paste contains commas or newlines, handle batch addition
  if (pasteData.includes(",") || pasteData.includes("\n")) {
    e.preventDefault();
    const items = pasteData.split(/[\n,]+/);
    let addedAny = false;
    for (const item of items) {
      const clean = item.trim().toLowerCase();
      if (clean && !tagList.value.includes(clean)) {
        tagList.value.push(clean);
        addedAny = true;
      }
    }
    if (addedAny) {
      syncModel();
    }
  }
}
</script>
