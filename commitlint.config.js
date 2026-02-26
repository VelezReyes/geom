module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', [
      'build',
      'chore',
      'ci',
      'docs',
      'feat',
      'fix',
      'perf',
      'refactor',
      'revert',
      'style',
      'test'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'scope-enum': [2, 'always', [
      'express-geom',
      'react-geom',
      'data',
      'legacy',
      'public'
    ]],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
    'footer-max-line-length': [2, 'always', 72]  
  }
};
