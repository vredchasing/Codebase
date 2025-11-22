import { useState, useEffect } from 'react';
import './refactorAnimation.css';

const ORIGINAL_CODE = [
  { line: 1, code: 'function processData(users) {', type: 'keyword' },
  { line: 2, code: '  const res = [];', type: 'variable' },
  { line: 3, code: '  for (let i = 0; i < users.length; i++) {', type: 'keyword' },
  { line: 4, code: '    const u = users[i];', type: 'variable' },
  { line: 5, code: '    if (u.age >= 18 && u.active) {', type: 'keyword' },
  { line: 6, code: '      const p = {', type: 'variable' },
  { line: 7, code: "        name: u.first + ' ' + u.last,", type: 'string' },
  { line: 8, code: '        email: u.email.toLowerCase(),', type: 'string' },
  { line: 9, code: '        id: u.id', type: 'property' },
  { line: 10, code: '      };', type: 'normal' },
  { line: 11, code: '      res.push(p);', type: 'function' },
  { line: 12, code: '    }', type: 'normal' },
  { line: 13, code: '  }', type: 'normal' },
  { line: 14, code: '  return res;', type: 'keyword' },
  { line: 15, code: '}', type: 'normal' },
];

const REFACTORED_CODE = [
  { line: 1, code: 'function processData(users) {', type: 'keyword' },
  { line: 2, code: '  return users', type: 'keyword', change: 'add' },
  { line: 3, code: '    .filter(u => u.age >= 18 && u.active)', type: 'function', change: 'add' },
  { line: 4, code: '    .map(u => ({', type: 'function', change: 'add' },
  { line: 5, code: "      name: `${u.first} ${u.last}`,", type: 'string', change: 'add' },
  { line: 6, code: '      email: u.email.toLowerCase(),', type: 'string', change: 'add' },
  { line: 7, code: '      id: u.id', type: 'property', change: 'add' },
  { line: 8, code: '    }));', type: 'normal', change: 'add' },
  { line: 9, code: '}', type: 'normal' },
];

const LINES_TO_REMOVE = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export default function RefactorAnimation() {
  const [animationPhase, setAnimationPhase] = useState('original'); // 'original', 'removing', 'refactored'
  const [visibleOriginalLines, setVisibleOriginalLines] = useState(new Set(ORIGINAL_CODE.map(l => l.line)));
  const [showRefactored, setShowRefactored] = useState(false);

  useEffect(() => {
    if (animationPhase === 'original') {
      // Show original code for 2 seconds, then start removing
      const timer1 = setTimeout(() => {
        setAnimationPhase('removing');
      }, 2000);

      return () => clearTimeout(timer1);
    } else if (animationPhase === 'removing') {
      // Remove lines one by one
      let lineIndex = 0;
      const removeInterval = setInterval(() => {
        if (lineIndex < LINES_TO_REMOVE.length) {
          setVisibleOriginalLines(prev => {
            const newSet = new Set(prev);
            newSet.delete(LINES_TO_REMOVE[lineIndex]);
            return newSet;
          });
          lineIndex++;
        } else {
          clearInterval(removeInterval);
          // After removing, show refactored code
          setTimeout(() => {
            setAnimationPhase('refactored');
            setShowRefactored(true);
          }, 500);
        }
      }, 80);

      return () => clearInterval(removeInterval);
    } else if (animationPhase === 'refactored') {
      // Show refactored code for 3 seconds, then restart
      const timer2 = setTimeout(() => {
        setAnimationPhase('original');
        setVisibleOriginalLines(new Set(ORIGINAL_CODE.map(l => l.line)));
        setShowRefactored(false);
      }, 3000);

      return () => clearTimeout(timer2);
    }
  }, [animationPhase]);

  const getCodeToDisplay = () => {
    if (animationPhase === 'original') {
      return ORIGINAL_CODE.map((line, index) => ({ ...line, line: index + 1, isRemoved: false, isNew: false }));
    }
    
    if (animationPhase === 'removing') {
      // Only show lines that are still visible (actually remove them from display)
      // Renumber sequentially based on array index
      return ORIGINAL_CODE
        .filter(line => visibleOriginalLines.has(line.line))
        .map((line, index) => ({ ...line, line: index + 1, isRemoved: false, isNew: false }));
    }
    
    // Show refactored code
    return REFACTORED_CODE.map((line, index) => ({
      ...line,
      line: index + 1,
      isRemoved: false,
      isNew: line.change === 'add'
    }));
  };

  return (
    <div className='refactor-animation-wrapper'>
      <div className="refactor-code-content">
        <div className="refactor-code-inner">
          <pre className="refactor-code-pre">
            <code className="refactor-code">
              {getCodeToDisplay().map((line, index) => {
                return (
                  <div
                    key={index}
                    className={`refactor-code-line ${line.isRemoved ? 'removed' : ''} ${line.isNew ? 'added' : ''}`}
                  >
                    <span className="refactor-line-number">{line.line}</span>
                    <span className={`refactor-code-text ${line.type} ${line.isNew ? 'added' : ''}`}>
                      {line.code}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
