import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { FolderCodeIcon } from "lucide-react";

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

  return (
    <main className="dark bg-background text-foreground h-screen">
      <ItemGroup>
        {data.map((repo, index) => (
          <>
            <Item key={repo.path} size="sm">
              <ItemContent className="gap-1">
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
              <Item key={wt.path} size="sm" className="ml-4">
                <ItemContent className="gap-1">
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
                </ItemActions>
              </Item>
            ))}
            {index !== data.length - 1 && <ItemSeparator />}
          </>
        ))}
      </ItemGroup>
    </main>
  );
}

export default App;
