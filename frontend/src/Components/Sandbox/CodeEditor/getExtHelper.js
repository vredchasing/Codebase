const extToLang = {
  ".js": "javascript",
  ".ts": "typescript",
  ".jsx": "javascript",
  ".tsx": "typescript",
  ".json": "json",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".md": "markdown",
  ".py": "python",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".cs": "csharp",
  ".rb": "ruby",
  ".go": "go",
  ".php": "php",
  ".rs": "rust",
  ".swift": "swift"
}

export default function getLangFromExt(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) {
    return 'plaintext';
  }
  const ext = filename.slice(idx).toLowerCase();
  return extToLang[ext] || 'plaintext';
}