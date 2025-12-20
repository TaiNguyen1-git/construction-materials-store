# 🤝 Contributing to SmartBuild AI

Thank you for your interest in contributing to SmartBuild AI! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (Atlas recommended)
- Git
- VS Code (recommended)

### Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/construction-materials-store.git
cd construction-materials-store
git remote add upstream https://github.com/ORIGINAL/construction-materials-store.git
```

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed  # Optional: seed sample data
```

### 4. Start Development Server

```bash
npm run dev
```

---

## Making Changes

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-payment-qr` |
| Bug Fix | `fix/description` | `fix/cart-total-calculation` |
| Hotfix | `hotfix/description` | `hotfix/login-error` |
| Docs | `docs/description` | `docs/api-endpoints` |

### 2. Make Your Changes

- Write clean, readable code
- Add comments for complex logic
- Update documentation if needed

### 3. Commit Your Changes

We use **Conventional Commits**:

```bash
git commit -m "feat: add QR code payment method"
git commit -m "fix: correct cart total calculation"
git commit -m "docs: update API documentation"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define types/interfaces for all data structures
- Avoid `any` type when possible

```typescript
// ✅ Good
interface Product {
  id: string;
  name: string;
  price: number;
}

// ❌ Avoid
const product: any = {...};
```

### React Components

- Use functional components with hooks
- Use descriptive component names
- Keep components focused and small

```tsx
// ✅ Good
export default function ProductCard({ product }: ProductCardProps) {
  return (...)
}

// ❌ Avoid
export default function PC({ p }: any) {...}
```

### File Structure

```
src/
├── components/      # React components
├── lib/            # Utilities and services
├── app/
│   ├── api/        # API routes
│   └── [page]/     # Page components
└── stores/         # State management
```

### ESLint

Run before committing:

```bash
npm run lint
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

- Place tests in `src/tests/` or next to source files
- Use descriptive test names

```typescript
import { describe, it, expect } from 'vitest';

describe('calculateTotal', () => {
  it('should calculate total with tax', () => {
    expect(calculateTotal(100, 0.1)).toBe(110);
  });
});
```

---

## Pull Request Process

### 1. Prepare Your PR

- Ensure all tests pass
- Run lint checks
- Update documentation if needed
- Rebase on latest main

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Create Pull Request

- Use a clear title (following Conventional Commits)
- Fill out the PR template
- Link related issues

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests added/updated
- [ ] Manual testing done

## Screenshots (if UI changes)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Updated documentation
```

### 4. Review Process

- Maintainers will review within 3-5 days
- Address feedback promptly
- Once approved, maintainer will merge

---

## Issue Guidelines

### Bug Reports

Use this template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.19.0]
```

### Feature Requests

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want.

**Alternatives considered**
Any alternative solutions you've considered.

**Additional context**
Any other context or screenshots.
```

---

## Questions?

- Open a GitHub Discussion
- Email: contributors@smartbuild.vn

---

Thank you for contributing! 🎉
