# Git Workflow - Healthcare IVR Platform

## Branch Structure

- `main` - Production branch, contains the live code
- `develop` - Development branch, contains features ready for next release
- `feature/*` - Feature branches for new development
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes for production
- `release/*` - Release preparation branches

## Branch Protection Rules

### Main Branch (`main`)
- Requires pull request reviews before merging
- Requires status checks to pass before merging
- Requires conversation resolution before merging
- Requires signed commits
- Requires linear history
- Includes administrators in these restrictions

### Development Branch (`develop`)
- Requires pull request reviews before merging
- Requires status checks to pass before merging
- Requires conversation resolution before merging
- Allows force pushes for administrators

## Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-new-feature
   
   # Make changes and commit
   git add .
   git commit -m "feat: description of changes"
   
   # Push to remote
   git push -u origin feature/my-new-feature
   ```

2. **Code Review Process**
   - Create pull request to `develop`
   - Assign reviewers
   - Address review comments
   - Get approval
   - Merge using squash merge

3. **Release Process**
   ```bash
   # Create release branch
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   
   # Make release preparations
   git push -u origin release/v1.0.0
   ```

4. **Hotfix Process**
   ```bash
   # Create hotfix branch
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   
   # Make fix and commit
   git push -u origin hotfix/critical-fix
   ```

## Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test changes
- chore: Build process or auxiliary tool changes

## CI/CD Integration

- All branches: Run tests and linting
- `develop`: Deploy to staging environment
- `main`: Deploy to production environment

## Security Measures

1. **Signed Commits**
   ```bash
   # Configure GPG signing
   git config --global commit.gpgsign true
   ```

2. **Protected Branches**
   - No direct pushes to `main` or `develop`
   - Required reviews for pull requests
   - Status checks must pass

3. **Sensitive Data**
   - Use `.gitignore` for sensitive files
   - Use AWS Secrets Manager for credentials
   - No hardcoded secrets in code

## Backup Procedures

1. **Automated Backups**
   - Daily database snapshots
   - S3 bucket versioning
   - CloudFormation stack backups

2. **Manual Backups**
   ```bash
   # Create backup branch
   git checkout main
   git checkout -b backup/YYYY-MM-DD
   git push origin backup/YYYY-MM-DD
   ```

## Best Practices

1. **Code Quality**
   - Write clear commit messages
   - Keep commits focused and atomic
   - Use meaningful branch names
   - Document significant changes

2. **Security**
   - Never commit sensitive data
   - Use environment variables
   - Review code for security issues
   - Keep dependencies updated

3. **Collaboration**
   - Communicate changes in pull requests
   - Use issue references in commits
   - Keep pull requests focused
   - Respond to review comments promptly

4. **Maintenance**
   - Regular dependency updates
   - Clean up old branches
   - Monitor CI/CD pipeline health
   - Review and update documentation 