import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { FolderCodeIcon, Trash2Icon } from "lucide-react";
import { NewWorkTreeForm } from "@/components/new-worktree-form";

interface Repository {
  path: string;
  name: string;
  worktrees: Worktree[];
}

interface Worktree {
  path: string;
  name: string;
}

function App() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery<Repository[]>({
    queryKey: ["repos"],
    queryFn: () => invoke("get_repos"),
  });

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (error) {
    return <span>Error: {(error as Error).message}</span>;
  }

  async function deleteWorktree(repoPath: string, worktreeName: string) {
    const confirmation = await confirm(
      "Are you sure you want to delete this worktree?",
      { title: worktreeName, kind: "warning" }
    );
    if (!confirmation) {
      return;
    }
    await invoke("delete_worktree", { repoPath, worktreeName });
    queryClient.invalidateQueries({ queryKey: ["repos"] });
  }

  return (
    <main className="dark bg-background text-foreground min-h-screen">
      <ItemGroup>
        {data.map((repo, index) => (
          <>
            <Item key={repo.path} size="sm" className="py-2">
              <ItemContent>
                <ItemTitle>{repo.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => invoke("open_in_vscode", { path: repo.path })}
                >
                  <FolderCodeIcon />
                </Button>
              </ItemActions>
            </Item>
            {repo.worktrees.map((wt) => (
              <Item key={wt.path} size="sm" className="ml-4 py-2">
                <ItemContent>
                  <ItemTitle>{wt.name}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => invoke("open_in_vscode", { path: wt.path })}
                  >
                    <FolderCodeIcon />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full"
                    onClick={() => deleteWorktree(repo.path, wt.name)}
                  >
                    <Trash2Icon />
                  </Button>
                </ItemActions>
              </Item>
            ))}
            <Item size="sm">
              <NewWorkTreeForm repoPath={repo.path} />
            </Item>
            {index !== data.length - 1 && <ItemSeparator />}
          </>
        ))}
      </ItemGroup>
    </main>
  );
}

export default App;
