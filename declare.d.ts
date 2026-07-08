declare module '@smithy/fetch-http-handler/dist-es/request-timeout';

declare module '*.wasm' {
  const content: string; // fallback if your bundler imports it as a URL/path
  export default content;
}
