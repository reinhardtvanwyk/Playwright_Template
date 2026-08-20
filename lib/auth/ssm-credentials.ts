import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

export interface Credentials {
  username: string;
  password: string;
}

const client = new SSMClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

async function fetchParameter(path: string): Promise<string> {
  const response = await client.send(
    new GetParameterCommand({ Name: path, WithDecryption: true })
  );
  const value = response.Parameter?.Value;
  if (!value) throw new Error(`SSM parameter not found or empty: ${path}`);
  return value;
}

export async function getCredentials(userIdentifier: string): Promise<Credentials> {
  // Local dev bypass — skips SSM entirely when env vars are present
  if (process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
    return { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD };
  }

  const env = process.env.TEST_ENV ?? 'dev';
  const base = `/playwright/${env}/${userIdentifier}`;
  try {
    const [username, password] = await Promise.all([
      fetchParameter(`${base}/username`),
      fetchParameter(`${base}/password`),
    ]);
    return { username, password };
  } catch (err) {
    throw new Error(
      `Failed to retrieve credentials for user "${userIdentifier}" from SSM (env: ${env}). ` +
      `Ensure the parameters ${base}/username and ${base}/password exist as SecureString. ` +
      `Original error: ${(err as Error).message}`
    );
  }
}
