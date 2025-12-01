# Coding Standards & Patterns

This document outlines the consistent patterns and standards used across the codebase.

## Function Declarations

**Use function declarations for React components:**
```javascript
// ✅ Good
function Login() {
  return <div>...</div>;
}

export default Login;
```

**Use arrow functions for utilities and helpers:**
```javascript
// ✅ Good
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

## API Calls

**Always use the centralized API client:**
```javascript
// ✅ Good
import { api, API_ENDPOINTS } from '../../utils';

const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
  email: form.email,
  password: form.password,
});

// ❌ Bad
import axios from 'axios';
const response = await axios.post('http://localhost:3000/api/auth/login', {...});
```

## Error Handling

**Always use error handling utilities:**
```javascript
// ✅ Good
import { handleError } from '../../utils';

try {
  const response = await api.post(url, data);
} catch (error) {
  const errorMessage = handleError(error, 'ComponentName', (msg) => {
    setErrors({ submit: msg });
  });
  setErrors({ submit: errorMessage });
}
```

## Form Validation

**Use validation utilities:**
```javascript
// ✅ Good
import { validateForm, VALIDATION_RULES } from '../../utils';

const validation = validateForm(form, {
  email: VALIDATION_RULES.EMAIL,
  password: VALIDATION_RULES.PASSWORD,
});

if (!validation.valid) {
  setErrors(validation.errors);
  return;
}
```

## Constants

**Use constants instead of magic strings/numbers:**
```javascript
// ✅ Good
import { COMPLEXITY, MESSAGE_ROLES } from '../../utils';

if (complexity === COMPLEXITY.MEDIUM) { }
const message = { role: MESSAGE_ROLES.USER, content: '...' };

// ❌ Bad
if (complexity === "2") { }
const message = { role: "user", content: '...' };
```

## Component State

**Use consistent state patterns:**
```javascript
// ✅ Good
const [form, setForm] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
```

## Async Functions

**Always handle errors in async functions:**
```javascript
// ✅ Good
async function handleSubmit(e) {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const response = await api.post(url, data);
    // Handle success
  } catch (error) {
    handleError(error, 'ComponentName');
  } finally {
    setIsLoading(false);
  }
}
```

## File Organization

**Component files should follow this structure:**
1. Imports (React, third-party, local)
2. Component function
3. Export default

```javascript
// ✅ Good
import React, { useState } from 'react';
import { api, handleError } from '../../utils';
import './Component.css';

function Component() {
  // Component logic
}

export default Component;
```

## Naming Conventions

- **Components**: PascalCase (`Login`, `Dashboard`)
- **Functions**: camelCase (`handleSubmit`, `validateForm`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`, `COMPLEXITY`)
- **CSS Classes**: kebab-case (`login-wrapper`, `header-content`)
- **Files**: Match component/function name (`Login.jsx`, `apiClient.js`)

## Comments

**Use JSDoc for functions:**
```javascript
/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  // ...
}
```

## Import Order

1. React and React-related
2. Third-party libraries
3. Utilities and config
4. Components
5. Styles

```javascript
// ✅ Good
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, handleError } from '../../utils';
import { Header } from '../Header';
import './Component.css';
```









