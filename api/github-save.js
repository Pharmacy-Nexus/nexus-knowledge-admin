function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) return resolve(req.body);
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (err) { reject(err); }
    });
    req.on("error", reject);
  });
}

function toBase64Utf8(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

async function getFileSha({ owner, repo, branch, path, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "nexus-admin"
    }
  });

  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Failed to get SHA for ${path}`);
  return data.sha || null;
}

async function putFile({ owner, repo, branch, path, content, message, token }) {
  const sha = await getFileSha({ owner, repo, branch, path, token });

  const body = {
    message,
    content: toBase64Utf8(content),
    branch
  };

  if (sha) body.sha = sha;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "nexus-admin"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Failed to upload ${path}`);
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token || !owner || !repo) {
      return res.status(500).json({
        error: "Missing GitHub env vars. Add GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH in Vercel."
      });
    }

    const body = await parseBody(req);
    const item = body.item;
    const index = body.index;

    if (!item || !item.path || !item.content) {
      return res.status(400).json({ error: "Missing item.path or item.content" });
    }

    const itemContent = typeof item.content === "string"
      ? item.content
      : JSON.stringify(item.content, null, 2);

    const indexContent = JSON.stringify(index || { items: [] }, null, 2);

    const uploadedItem = await putFile({
      owner,
      repo,
      branch,
      path: item.path,
      content: itemContent,
      message: `Add/update ${item.path}`,
      token
    });

    const uploadedIndex = await putFile({
      owner,
      repo,
      branch,
      path: "data/index.json",
      content: indexContent,
      message: "Update data/index.json",
      token
    });

    return res.status(200).json({
      ok: true,
      uploaded: [uploadedItem.content?.path, uploadedIndex.content?.path]
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "GitHub upload failed"
    });
  }
};
