import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'android/**', 'public/sw.js', 'next-env.d.ts'] },
];

export default config;
