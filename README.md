# bulk-transfer-issues

イシューを一括転送するスクリプトです。

デフォルトでは未解決のイシューをラベル付きで転送します。  
必要に応じて `index.js` を編集してください。

## 使いかた

// Personal Access Token を作り、`.env` などで `GITHUB_PERSONAL_ACCESS_TOKEN` に設定してください。  
// https://github.com/settings/tokens/new?scopes=repo

`index.js` で以下の変数を設定してください。

```js
const owner = 'octocat'; // リポジトリ所有者
const sourceRepositoryName = 'repo-1'; // 転送元リポジトリ
const destinationRepositoryName = 'repo-2'; // 転送先リポジトリ
```

