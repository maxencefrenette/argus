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
import { FolderCodeIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { NewWorkTreeForm } from "@/components/new-worktree-form";
import { useState, useEffect } from "react";

interface Repository {
  path: string;
  name: string;
  worktrees: Worktree[];
}

interface Worktree {
  path: string;
  name: string;
  }

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-md flex items-center justify-between mb-4 mx-4 mt-4">
      <div className="flex items-center gap-2">
        <XCircleIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20 hover:text-red-600" onClick={onClose}>
        <XCircleIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery<Repository[]>({
    queryKey: ["repos"],
    queryFn: async () => {
        try {
            return await invoke("get_repos");
        } catch (e) {
            throw new Error(String(e));
        }
    },
  });

  useEffect(() => {
      if (error) {
          setGlobalError(error.message);
      }
  }, [error]);

  if (isPending) {
    return <span>Loading...</span>;
  }

  async function deleteWorktree(repoPath: string, worktreeName: string) {
    setGlobalError(null);
    const confirmation = await confirm(
      "Are you sure you want to delete this worktree?",
      { title: worktreeName, kind: "warning" }
    );
    if (!confirmation) {
      return;
    }
    try {
        await invoke("delete_worktree", { repoPath, worktreeName });
        queryClient.invalidateQueries({ queryKey: ["repos"] });
    } catch (e) {
        setGlobalError(String(e));
    }
  }

  async function openInEditor(path: string) {
      setGlobalError(null);
      try {
          await invoke("open_in_editor", { path });
      } catch (e) {
          setGlobalError(String(e));
      }
  }

  return (
    <main className="dark bg-background text-foreground h-screen flex flex-col">
      <ErrorBanner message={globalError || ""} onClose={() => setGlobalError(null)} />
      <div className="flex-1 overflow-auto">
      <ItemGroup>
        {data?.map((repo, index) => (
          <div key={repo.path}>
            <Item size="sm" className="py-2">
              <ItemContent>
                <ItemTitle>{repo.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => openInEditor(repo.path)}
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
                  onClick={() => openInEditor(wt.path)}
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
              <NewWorkTreeForm repoPath={repo.path} onError={(e) => setGlobalError(e)} />
            </Item>
            {index !== (data?.length || 0) - 1 && <ItemSeparator />}
          </div>
        ))}
      </ItemGroup>
      </div>
    </main>
  );
}

export default App;
