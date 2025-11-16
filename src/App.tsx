import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { useQuery } from "@tanstack/react-query";

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
    <main className="container">
      {data.map((repo) => (
        <div key={repo.path}>
          <h2>
            {repo.name}{" "}
            <button
              onClick={() => invoke("open_in_vscode", { path: repo.path })}
            >
              Open
            </button>
          </h2>
          {repo.worktrees.map((wt) => (
            <div key={wt.path} style={{ marginLeft: "20px" }}>
              <span>{wt.name}</span>
              <button
                onClick={() => invoke("open_in_vscode", { path: wt.path })}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}

export default App;
