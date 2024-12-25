import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'example',
      'packages/svg-render/test/uiviewer',
    ],
  },
)
