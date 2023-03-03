export function assetRootPath(src: string) {
  return `${
    src.startsWith("/") && process.env.DEPLOY_MODE === "ipfs" ? "." : ""
  }${src}`;
}
