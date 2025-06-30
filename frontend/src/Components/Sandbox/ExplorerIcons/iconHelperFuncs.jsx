import { extensionIconMap} from './Icons';


export default function getIcon(file) {
  if(file.type === 'folder') {
    return;
  }
  const extension = file.name.split('.').pop().toLowerCase();
  return extensionIconMap[extension] || extensionIconMap.default;
}

export function createNewFile (name, type = 'file') {
  let icon = getIcon({ name, type });

  let file = {
    name: name,
    type: type,
    content: '',
    icon: icon,
  }

}