module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  // vue-eslint-parser parses .vue files and delegates <script lang="ts">
  // blocks to @typescript-eslint/parser via parserOptions.parser.
  //
  // Note: we install @typescript-eslint/parser for PARSING only —
  // @typescript-eslint/recommended (which adds TS-aware rules) is
  // intentionally NOT extended. The project's broader TS lint hygiene is
  // tracked separately; this config's purpose is to enable the two
  // grief-mode contract rules (no-restricted-imports + vue/no-bare-strings
  // -in-template) below.
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-console': 'warn',
    // ESLint's `no-undef` and `no-unused-vars` are TypeScript-unaware:
    //   - no-undef flags DOM types (BlobPart, RequestInfo) as undefined
    //     because they're TS types, not runtime globals.
    //   - no-unused-vars doesn't recognize the `_paramName` convention
    //     and conflicts with TS's own `noUnusedLocals` / `noUnusedParameters`
    //     which already run via `vue-tsc` on build.
    // TypeScript handles both correctly at compile time; ESLint's versions
    // are noise.
    'no-undef': 'off',
    'no-unused-vars': 'off',
    // Grief-mode contract: only Tier 1 wrappers in `src/components/ui/`
    // may import directly from `reka-ui`. The wrapper override re-allows
    // it for that directory only. Adding more wrappers? Put them under
    // `src/components/ui/`. See `src/components/ui/README.md`.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            // Match the bare specifier AND any subpath (`reka-ui/dist/...`,
            // `reka-ui/namespaced/...`). Without the wildcard, deep imports
            // would slip through the grief-mode contract.
            group: ['reka-ui', 'reka-ui/*', 'reka-ui/**'],
            message:
              'Direct reka-ui imports are not allowed outside src/components/ui/. Use the Tier 1 wrappers (UiDialog, UiPopover, UiTabs, UiTooltip) instead.',
          },
        ],
      },
    ],
  },
  overrides: [
    // Inside the Tier 1 wrapper directory, reka-ui imports are allowed.
    {
      files: ['src/components/ui/**/*.{vue,ts}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    // Wrappers MUST NOT carry hardcoded user-facing strings — all copy
    // flows through props/slots from the consumer (Companion Voice
    // discipline). The rule is scoped to the wrapper directory only;
    // the rest of the codebase is unaffected by this story.
    {
      files: ['src/components/ui/**/*.vue'],
      rules: {
        'vue/no-bare-strings-in-template': 'error',
      },
    },
  ],
}
