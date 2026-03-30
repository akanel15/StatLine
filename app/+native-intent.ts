export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (path && path.toLowerCase().includes(".statline")) {
      return `/import?fileUri=${encodeURIComponent(path)}`;
    }
    return path;
  } catch {
    return path;
  }
}
