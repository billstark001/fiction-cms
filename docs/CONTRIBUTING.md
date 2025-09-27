# Contributing to Fiction CMS

Thank you for your interest in contributing to Fiction CMS! This guide will help you get started with contributing code, documentation, bug reports, and feature requests.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Types](#contribution-types)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful and inclusive** in all interactions
- **Focus on constructive feedback** and solutions
- **Welcome newcomers** and help them get started
- **Respect different viewpoints** and experiences
- **Show empathy** towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **pnpm** package manager (preferred) or npm
- **Git** configured with your name and email
- **GitHub account** for submitting pull requests

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/fiction-cms.git
   cd fiction-cms
   git remote add upstream https://github.com/billstark001/fiction-cms.git
   ```

3. **Install dependencies**:

   ```bash
   pnpm install
   ```

4. **Set up development environment**:

   ```bash
   # Create backend environment file
   cp packages/backend/.env.example packages/backend/.env
   # Edit the .env file with your settings
   ```

5. **Start development servers**:

   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Management

- **main**: Production-ready code
- **develop**: Integration branch for features (if used)
- **feature/description**: New features
- **fix/description**: Bug fixes
- **docs/description**: Documentation updates
- **refactor/description**: Code refactoring

### Working on Issues

1. **Check existing issues** before starting work
2. **Comment on the issue** to indicate you're working on it
3. **Create a branch** from main:

   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/my-new-feature
   ```

4. **Make your changes** following coding standards
5. **Test your changes** thoroughly
6. **Commit your changes** with descriptive messages
7. **Push and create a pull request**

### Keeping Your Fork Updated

```bash
# Sync with upstream regularly
git checkout main
git pull upstream main
git push origin main

# Rebase your feature branch
git checkout feature/my-feature
git rebase main
```

## Contribution Types

### Bug Reports

**Before reporting a bug:**

- Check if the issue already exists
- Try to reproduce it on the latest version
- Gather relevant system information

**Good bug report includes:**

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Environment details (OS, Node.js version, etc.)
- Error messages and logs
- Screenshots if applicable

**Bug Report Template:**

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should have happened

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.17.0]
- Fiction CMS Version: [e.g., 1.0.0]
- Browser: [if applicable]

## Additional Context
Any additional information, logs, or screenshots
```

### Feature Requests

**Before requesting a feature:**

- Check if it's already been requested
- Consider if it fits the project's scope
- Think about implementation complexity

**Good feature request includes:**

- Clear problem statement
- Proposed solution
- Alternative solutions considered
- Use cases and examples
- Potential implementation approach

### Documentation Improvements

Documentation contributions are highly valued:

- **Fix typos and grammar**
- **Improve clarity and examples**
- **Add missing documentation**
- **Translate to other languages**
- **Update outdated information**

### Code Contributions

Code contributions should:

- **Solve a real problem**
- **Follow project conventions**
- **Include appropriate tests**
- **Update relevant documentation**
- **Maintain backward compatibility when possible**

## Coding Standards

### TypeScript Guidelines

**Type Safety:**

```typescript
// Good: Explicit types
interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Good: Generic constraints
function processData<T extends Record<string, unknown>>(data: T): T {
  return data;
}

// Avoid: any type
const userData: any = getUserData(); // Bad

// Good: Proper typing
const userData: User = getUserData();
```

**Function Declarations:**

```typescript
// Good: Explicit return types for exported functions
export function createUser(userData: CreateUserRequest): Promise<User> {
  // implementation
}

// Good: Arrow functions for inline callbacks
const users = await Promise.all(
  userIds.map(async (id) => await fetchUser(id))
);
```

### Code Style

**Formatting:**

- Use **Prettier** for consistent formatting
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** in multi-line structures

**Naming Conventions:**

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
function getUserData() {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Classes and interfaces: PascalCase
class UserManager {}
interface ApiResponse {}

// Files and directories: kebab-case
// user-manager.ts
// api-client/
```

**Error Handling:**

```typescript
// Good: Specific error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Good: Result pattern for operations that can fail
interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

async function processFile(path: string): Promise<Result<string>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### React/Frontend Guidelines

**Component Structure:**

```typescript
// Good: Functional component with proper typing
interface UserCardProps {
  user: User;
  onEdit?: (userId: number) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  const handleEditClick = useCallback(() => {
    onEdit?.(user.id);
  }, [user.id, onEdit]);

  return (
    <div className={styles.userCard}>
      <h3>{user.username}</h3>
      {onEdit && (
        <button onClick={handleEditClick}>Edit</button>
      )}
    </div>
  );
};
```

**Custom Hooks:**

```typescript
// Good: Custom hook with proper typing
interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

function useApi<T>(
  endpoint: string, 
  options: UseApiOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  // implementation
}
```

### Backend/API Guidelines

**Route Handlers:**

```typescript
// Good: Structured route handler
export const getUserById = async (c: Context) => {
  try {
    const userId = Number(c.req.param('id'));
    
    if (!userId) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }
    
    const user = await userService.findById(userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};
```

**Service Layer:**

```typescript
// Good: Service with proper error handling
class UserService {
  async findById(id: number): Promise<User | null> {
    try {
      const user = await db.select().from(users).where(eq(users.id, id));
      return user[0] || null;
    } catch (error) {
      logger.error('Database error in findById:', error);
      throw new DatabaseError('Failed to fetch user');
    }
  }
  
  async create(userData: CreateUserRequest): Promise<User> {
    const validation = CreateUserSchema.safeParse(userData);
    
    if (!validation.success) {
      throw new ValidationError('Invalid user data', validation.error);
    }
    
    // implementation
  }
}
```

## Testing Guidelines

### Test Structure

**Unit Tests:**

```typescript
// Good: Descriptive test structure
describe('UserService', () => {
  describe('findById', () => {
    it('should return user when valid ID is provided', async () => {
      // Arrange
      const userId = 1;
      const expectedUser = { id: 1, username: 'testuser' };
      
      // Act
      const result = await userService.findById(userId);
      
      // Assert
      expect(result).toEqual(expectedUser);
    });
    
    it('should return null when user does not exist', async () => {
      const result = await userService.findById(999);
      expect(result).toBeNull();
    });
    
    it('should throw error when database connection fails', async () => {
      // Mock database failure
      jest.spyOn(db, 'select').mockRejectedValue(new Error('Connection failed'));
      
      await expect(userService.findById(1)).rejects.toThrow(DatabaseError);
    });
  });
});
```

**Integration Tests:**

```typescript
describe('User API', () => {
  it('should create user with valid data', async () => {
    const userData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'SecurePass123!'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      username: userData.username,
      email: userData.email
    });
  });
});
```

### Testing Best Practices

- **Write tests for new features** and bug fixes
- **Test edge cases** and error conditions
- **Use descriptive test names** that explain the scenario
- **Keep tests independent** of each other
- **Mock external dependencies** appropriately
- **Aim for good coverage** but focus on critical paths

## Documentation Guidelines

### Writing Documentation

**Documentation should be:**

- **Clear and concise**
- **Well-organized** with proper headings
- **Include examples** where appropriate
- **Keep up-to-date** with code changes
- **Accessible** to different skill levels

**Code Documentation:**

```typescript
/**
 * Validates and processes a file upload operation.
 * 
 * @param siteId - The ID of the site where the file will be uploaded
 * @param filePath - The target path for the uploaded file
 * @param content - The file content as a string or buffer
 * @param options - Additional upload options
 * @returns Promise resolving to the upload result
 * 
 * @throws {ValidationError} When file path or content is invalid
 * @throws {PermissionError} When user lacks upload permissions
 * 
 * @example
 * ```typescript
 * const result = await uploadFile(1, 'content/post.md', markdownContent);
 * if (result.success) {
 *   console.log('File uploaded successfully');
 * }
 * ```
 */
async function uploadFile(
  siteId: number,
  filePath: string,
  content: string | Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // implementation
}
```

### API Documentation

When adding new API endpoints:

1. **Update the API documentation** in `docs/api.md`
2. **Include request/response examples**
3. **Document error responses**
4. **Update OpenAPI spec** if available

## Pull Request Process

### Before Submitting

**Checklist:**

- [ ] Code follows project style guidelines
- [ ] Tests pass locally (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

**What reviewers look for:**

- Code quality and style consistency
- Test coverage and quality
- Performance implications
- Security considerations
- Documentation completeness
- Backward compatibility

**As a contributor:**

- **Be responsive** to review feedback
- **Ask questions** if feedback is unclear
- **Make requested changes** promptly
- **Be open** to suggestions and improvements

## Release Process

### Versioning

Fiction CMS follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (x.y.0): New features, backward compatible
- **PATCH** (x.y.z): Bug fixes, backward compatible

### Release Workflow

1. **Version bump** in package.json files
2. **Update changelog** with release notes
3. **Create release branch** if doing a major release
4. **Run full test suite** and ensure quality
5. **Tag release** following semver
6. **Create GitHub release** with release notes
7. **Deploy to production** environments

### Contributing to Releases

- **Test release candidates** when available
- **Report issues** found in pre-release versions
- **Help with release notes** and documentation
- **Assist with migration guides** for breaking changes

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussion
- **Pull Request Comments**: Code-specific discussions

### Maintainer Response

- **Issues**: We aim to respond within 48 hours
- **Pull Requests**: Initial review within 72 hours
- **Security Issues**: Immediate attention and private disclosure

### Recognition

Contributors are recognized through:

- **Contributors list** in README
- **Release notes** acknowledgments
- **GitHub contributor insights**
- **Special mentions** for significant contributions

Thank you for contributing to Fiction CMS! Your efforts help make this project better for everyone.
