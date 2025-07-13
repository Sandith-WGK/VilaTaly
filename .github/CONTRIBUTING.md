# Contributing to VilaTaly

Thank you for your interest in contributing to VilaTaly Hotel Management System! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Code Review Process](#code-review-process)

## Getting Started

1. **Fork the repository**
2. **Clone your fork locally**
   ```bash
   git clone https://github.com/yourusername/VilaTaly.git
   cd VilaTaly
   ```
3. **Add the original repository as upstream**
   ```bash
   git remote add upstream https://github.com/original-owner/VilaTaly.git
   ```

## Development Setup

### Backend Setup
```bash
cd backend
npm install
# Create .env file with your configuration
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Code Style Guidelines

### JavaScript/Node.js (Backend)
- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Use async/await instead of callbacks

### React (Frontend)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component names
- Keep components small and focused
- Use PropTypes or TypeScript for type checking

### General
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Update documentation for any changes
- Add comments for complex logic

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Submitting Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Write tests for new features
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use the provided template
   - Describe your changes clearly
   - Link any related issues

## Issue Guidelines

### Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide expected vs actual behavior
- Include environment details

### Feature Requests
- Use the feature request template
- Describe the problem you're solving
- Provide use cases and examples
- Consider implementation complexity

## Code Review Process

1. **Automated Checks**
   - All PRs must pass CI/CD checks
   - Code coverage should not decrease
   - No linting errors

2. **Review Criteria**
   - Code quality and style
   - Functionality and logic
   - Test coverage
   - Documentation updates

3. **Review Timeline**
   - Initial review within 48 hours
   - Follow-up reviews within 24 hours
   - Final approval from maintainers

## Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Report bugs and request features
- **Documentation**: Check the README and code comments

## Recognition

All contributors will be:
- Listed in [CONTRIBUTORS.md](../CONTRIBUTORS.md)
- Added to package.json contributors field
- Recognized in release notes
- Given credit in the project README

---

Thank you for contributing to VilaTaly! 🎉 