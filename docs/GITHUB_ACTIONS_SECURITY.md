# GitHub Actions Security Configuration

This document explains the security measures implemented in the GitHub Actions workflows for this repository.

## Security Best Practices Applied

### 1. Principle of Least Privilege

All workflows follow the principle of least privilege by:

- **Minimal Workflow-Level Permissions**: Default permissions are set to `contents: read` at the workflow level
- **Explicit Job-Level Permissions**: Each job explicitly defines its required permissions
- **No Write Access**: No write permissions are granted unless absolutely necessary
- **No Default Permissions**: We don't rely on GitHub's default permissions which may be overly permissive

Example:
```yaml
permissions:
  contents: read  # Workflow level - minimal read access only

jobs:
  test:
    permissions:
      contents: read  # Job level - explicit read-only access
```

### 2. Updated Dependencies

All GitHub Actions are kept up-to-date to ensure security patches are applied:

- `actions/checkout@v4` - Latest stable version for repository checkout
- `actions/setup-node@v4` - Latest stable version for Node.js setup
- `actions/upload-artifact@v4` - Updated from deprecated v3 to current v4
- `codecov/codecov-action@v4` - Updated from v3 to latest secure version

### 3. Secrets Management

Secrets are handled securely:

- Secrets are never logged or exposed in workflow output
- Secrets are scoped to specific jobs that need them
- Environment variables containing secrets are only available to necessary steps
- Public test data uses separate non-secret environment variables

### 4. Third-Party Actions

While we currently use tag-based versions for ease of maintenance, for production environments consider:

- Pinning actions to full commit SHA for immutability
- Regular audits of third-party actions for vulnerabilities
- Using only well-maintained, widely-used actions from trusted sources

### 5. Workflow Triggers

Workflows are configured with appropriate triggers:

- `push` events limited to specific branches (main, develop, copilot/**)
- `pull_request` events restricted to main and develop branches
- `workflow_dispatch` enabled for manual testing when needed

## Permissions Explained

### `contents: read`

This permission allows workflows to:
- Clone the repository
- Read files from the repository
- Access repository contents

This permission does NOT allow:
- Writing or modifying repository contents
- Creating or modifying pull requests
- Creating releases or tags
- Modifying issues or discussions

## Security Scanning

This repository uses:

- **CodeQL Analysis**: Automated security scanning for vulnerabilities
- **actionlint**: GitHub Actions workflow validation
- **yamllint**: YAML syntax validation

## Future Improvements

Consider implementing:

1. **OpenID Connect (OIDC)**: For cloud provider authentication without long-lived secrets
2. **Commit SHA Pinning**: Pin all actions to specific commit SHAs instead of tags
3. **Branch Protection Rules**: Require status checks to pass before merging
4. **Environment-Specific Secrets**: Use GitHub Environments for deployment-specific secrets
5. **Secret Scanning**: Enable GitHub Advanced Security secret scanning

## References

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Implementing Least Privilege for Secrets](https://github.blog/security/application-security/implementing-least-privilege-for-secrets-in-github-actions/)
- [Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use)
