import { Octokit } from 'octokit';
import * as dotenv from 'dotenv';
dotenv.config();

// Personal Access Token を作って GITHUB_PERSONAL_ACCESS_TOKEN に設定しておく
// https://github.com/settings/tokens/new?scopes=repo

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  timeZone: 'Asia/Tokyo'
});

const owner = 'octocat'; // リポジトリ所有者
const sourceRepositoryName = 'old-repo'; // 転送元リポジトリ
const destinationRepositoryName = 'new-repo'; // 転送先リポジトリ

try {
  const destinationRepositoryId = await getRepositoryId(owner, destinationRepositoryName);
  const issueIds = await getIssueIds(owner, sourceRepositoryName);

  for (const issueId of issueIds) {
    const url = await transferIssue(issueId, destinationRepositoryId);
    console.info('転送先', url);
  }
} catch (error) {
  console.error(error);
}

/**
 * 転送元リポジトリの未解決のイシューの ID を取得する
 * @param {string} owner リポジトリの所有者
 * @param {string} repositoryName リポジトリの名前
 * @returns {string[]} イシューの ID の配列
 */
async function getIssueIds(owner, repositoryName) {
  let hasNextPage, endCursor;
  let issues = [];

  do {
    const { repository } = await octokit.graphql(
      `
        query ($owner: String!, $name: String!, $after: String, $states: [ IssueState! ]) {
          repository(owner: $owner, name: $name) {
            issues(first: 100, after: $after, states: $states) {
              pageInfo { endCursor hasNextPage }
              nodes { id }
            }
          }
        }
      `,
      {
        owner: owner,
        name: repositoryName,
        after: endCursor,
        states: 'OPEN' // 未解決 ('OPEN'), 解決済 ('CLOSED')
      }
    );

    issues = issues.concat(repository.issues.nodes.map(node => node.id));
    hasNextPage = repository.issues.pageInfo.hasNextPage;
    endCursor = repository.issues.pageInfo.endCursor;
  } while (hasNextPage);

  return issues;
}

/**
 * 転送先リポジトリの ID を取得する
 * @param {string} owner リポジトリの所有者
 * @param {string} repositoryName リポジトリの名前
 * @returns {string} 転送先リポジトリの ID
 */
async function getRepositoryId(owner, repositoryName) {
  const { repository } = await octokit.graphql(
    `
      query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id,
        }
      }
    `,
    {
      owner: owner,
      name: repositoryName
    }
  );

  return repository.id;
}

/**
 * イシューを転送する
 * @param {string} issueId 転送するイシューの ID
 * @param {string} repositoryId 転送先リポジトリの ID
 * @returns {string} 転送したイシューの URL
 */
async function transferIssue(issueId, repositoryId) {
  const { transferIssue: { issue: { url } } } = await octokit.graphql(
    `
      mutation ($issueId: ID!, $repositoryId: ID!, $createLabelsIfMissing: Boolean) {
        transferIssue(input: { issueId: $issueId, repositoryId: $repositoryId, createLabelsIfMissing: $createLabelsIfMissing }) {
          issue { url number }
        }
      }
    `,
    {
      issueId,
      repositoryId,
      createLabelsIfMissing: true // 転送先のリポジトリにラベルがない場合は作成する
    }
  );

  return url;
}
