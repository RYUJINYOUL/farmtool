// /app/editor/[username]/page.tsx
import EditPage from './EditPage';

type Props = Promise<{ username: string }>;

export default async function EditorUsernamePage({ params }: {params :Props}) {
  const { username } = await params;
  return <EditPage username={username} />;
}