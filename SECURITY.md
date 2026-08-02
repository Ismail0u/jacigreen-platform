# Security policy

## Supported versions

The current project is in active development. Security fixes will be prioritized for the main branch and any actively maintained release branches.

## Reporting a vulnerability

Please report suspected vulnerabilities privately by opening a GitHub security advisory or contacting the repository maintainer directly.

Do not disclose vulnerabilities in public issues or pull requests.

## Production security checklist

- Use strong secrets in environment variables only.
- Keep JWT signing keys separate from code and repository history.
- Restrict CORS to approved domains only.
- Enforce HTTPS in production.
- Validate all user uploads and images.
- Rotate database and secret values periodically.
- Use least-privilege access for Supabase and Railway roles.
- Monitor logs and failed auth attempts.
- Run the SAST and DAST pipeline on each push and nightly.
