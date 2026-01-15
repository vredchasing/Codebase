import {extensionIconMap} from './Icons';

export default function getIcon(file) {
  if (file.type === 'folder') {
    return;
  }
  const extension = file.name.split('.').pop().toLowerCase();
  return extensionIconMap[extension] || extensionIconMap.default;
}

// 🔹 Direct lookup for live-typed filenames (input field)
export function getInputIcon(value) {
  if (!value) return extensionIconMap.default; // empty input

  const lastDotIndex = value.lastIndexOf('.');
  let ext;

  if (lastDotIndex !== -1 && lastDotIndex < value.length - 1) {
    ext = value.substring(lastDotIndex + 1).toLowerCase();
  }

  if (ext && extensionIconMap[ext]) {
    return extensionIconMap[ext]; // known extension
  }

  return extensionIconMap.default; // no dot yet or unknown extension
}


// 🔹 Helper to create a new file object
export function createNewFile(name, type = 'file') {
  let icon = getIcon({ name, type });

  return {
    name: name,
    type: type,
    content: '',
    icon: icon,
  };
}
