<script setup lang="ts">
const { size = 34 } = defineProps<{ size?: number }>()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 34 34" aria-label="红果短剧">
    <defs>
      <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FF7A44" />
        <stop offset=".55" stop-color="#FF3D5B" />
        <stop offset="1" stop-color="#E21959" />
      </linearGradient>
      <linearGradient id="logo-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="34" height="34" rx="8" fill="url(#logo-bg)" />
    <rect width="34" height="17" rx="8" fill="url(#logo-gloss)" />
    <path
      fill="#fff"
      fill-rule="evenodd"
      transform="translate(7.83359 9.67029)"
      d="M0.1064 5.2497C0.9264 -0.5103 6.6964 -0.9303 9.1664 1.1297C11.3664 -0.7003 16.1764 -0.5803 17.7864 3.5397Q16.5001 4.7121 16.5794 6.4507C16.6323 7.6098 17.1213 8.5394 18.0464 9.2397C17.0564 13.5397 13.5964 17.1997 9.1664 17.1997C3.3964 17.1997 -0.7236 11.0197 0.1064 5.2497ZM7.5164 10.6897Q7.5164 11.2246 7.7488 11.3596Q7.9813 11.4948 8.4464 11.2297L12.2764 8.9997Q12.74 8.7355 12.7414 8.4689Q12.7428 8.2005 12.2764 7.9297L8.4464 5.7097Q7.9799 5.4388 7.7474 5.5731Q7.5164 5.7065 7.5164 6.2397L7.5164 10.6897Z"
    />
    <path
      fill="#5BE08A"
      transform="translate(17.33 6.50745)"
      d="M0 3.9625C0.08 1.4125 2.14 -0.1575 5.27 0.0125C5.27 2.8125 3.13 4.2925 0 3.9625Z"
    />
  </svg>
</template>
