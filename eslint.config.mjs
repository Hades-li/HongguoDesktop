import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out', '**/release'] },
  tseslint.configs.recommended,
  eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts'
          }
        }
      ]
    }
  },
  {
    // composable 返回值由推导得出（手写类型冗长且易与实现脱节）
    files: ['src/renderer/src/composables/**/*.ts'],
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' }
  },
  {
    // 组件规范：只允许 <script setup> 组合式写法，并约束精简度（见 docs/开发文档-UI重构.md §8.3）
    files: ['**/*.vue'],
    rules: {
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'] }
      ],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-props-destructuring': ['error', { destructure: 'only-when-assigned' }],
      'vue/define-emits-declaration': ['error', 'type-literal'],
      'vue/require-macro-variable-name': 'error',
      'vue/prefer-define-options': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error'
    }
  },
  eslintConfigPrettier
)
