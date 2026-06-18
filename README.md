# Nexus Admin GitHub Direct

Admin page + Vercel API route to upload Knowledge Core files directly to a private GitHub repo.

## Files

```text
public/admin.html
public/admin.css
public/admin.js
api/github-save.js
vercel.json
```

## Vercel Environment Variables

Add these in Vercel Project Settings → Environment Variables:

```text
GITHUB_TOKEN=your_fine_grained_github_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=nexus-knowledge-core
GITHUB_BRANCH=main
```

## GitHub Token Permissions

Use a fine-grained personal access token:
- Repository access: only the private knowledge repo
- Permissions:
  - Contents: Read and write
  - Metadata: Read

Never put the GitHub token inside frontend HTML/JS.
