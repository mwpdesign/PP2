# Setup Checklist - Healthcare IVR Platform

## GitHub Repository Configuration

### Branch Protection Rules
- [ ] Configure main branch protection:
  - [ ] Go to Settings > Branches
  - [ ] Add rule for `main` branch
  - [ ] Enable "Require pull request reviews before merging"
  - [ ] Enable "Require status checks to pass before merging"
  - [ ] Enable "Require conversation resolution before merging"
  - [ ] Enable "Require signed commits"
  - [ ] Enable "Include administrators"
  - [ ] Save changes

- [ ] Configure develop branch protection:
  - [ ] Add rule for `develop` branch
  - [ ] Enable "Require pull request reviews before merging"
  - [ ] Enable "Require status checks to pass before merging"
  - [ ] Enable "Require conversation resolution before merging"
  - [ ] Save changes

### Repository Secrets
- [ ] Add AWS credentials:
  - [ ] Go to Settings > Secrets and variables > Actions
  - [ ] Add `AWS_ACCESS_KEY_ID`
  - [ ] Add `AWS_SECRET_ACCESS_KEY`
  - [ ] Add `AWS_REGION` (if different from us-east-1)

- [ ] Add notification settings:
  - [ ] Set up Slack workspace
  - [ ] Add `SLACK_WEBHOOK` secret

- [ ] Add security scanning:
  - [ ] Create Snyk account
  - [ ] Add `SNYK_TOKEN` secret

### Environment Setup
- [ ] Configure production environment:
  - [ ] Go to Settings > Environments
  - [ ] Create "production" environment
  - [ ] Add required reviewers
  - [ ] Add deployment branch rules
  - [ ] Configure environment secrets if needed

## Local Development Setup

### Git Configuration
- [ ] Set up GPG key for signed commits:
  ```bash
  # Generate GPG key
  gpg --full-generate-key
  
  # Configure Git
  git config --global user.signingkey YOUR_KEY_ID
  git config --global commit.gpgsign true
  ```

- [ ] Add GPG key to GitHub:
  - [ ] Go to Settings > SSH and GPG keys
  - [ ] Add GPG key

### AWS Configuration
- [ ] Configure AWS CLI:
  ```bash
  aws configure
  ```

- [ ] Test AWS access:
  ```bash
  aws sts get-caller-identity
  ```

## Infrastructure Verification

### AWS Services
- [ ] Verify VPC setup
- [ ] Check RDS instance status
- [ ] Confirm Cognito pools are created
- [ ] Test S3 bucket access
- [ ] Verify CloudTrail logging
- [ ] Check ElastiCache cluster status

### CI/CD Pipeline
- [ ] Create test PR to verify:
  - [ ] CI workflow triggers
  - [ ] Tests run successfully
  - [ ] Security scans complete
  - [ ] Branch protection works

### Monitoring & Alerts
- [ ] Set up AWS CloudWatch dashboards
- [ ] Configure alert thresholds
- [ ] Test Slack notifications
- [ ] Verify backup procedures

## Security Compliance

### HIPAA Requirements
- [ ] Review encryption settings
- [ ] Verify audit logging
- [ ] Check access controls
- [ ] Test backup procedures
- [ ] Document compliance measures

### Security Best Practices
- [ ] Enable MFA for all AWS users
- [ ] Review IAM permissions
- [ ] Check security group rules
- [ ] Verify SSL/TLS settings

## Documentation

### Update Documentation
- [ ] Review and update README.md
- [ ] Complete API documentation
- [ ] Update deployment guides
- [ ] Document security procedures

### Team Access
- [ ] Grant team access to:
  - [ ] GitHub repository
  - [ ] AWS Console
  - [ ] Monitoring tools
  - [ ] Documentation

## Final Verification
- [ ] Run complete system test
- [ ] Verify all automations
- [ ] Test rollback procedures
- [ ] Document any issues found 