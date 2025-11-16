import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { invoke } from "@tauri-apps/api/core";
import { useQueryClient } from "@tanstack/react-query";

interface NewWorkTreeFormProps {
  repoPath: string;
}

export function NewWorkTreeForm(props: NewWorkTreeFormProps) {
  const queryClient = useQueryClient();
  const [isEnteringNewWorktree, setIsEnteringNewWorktree] = useState(false);
  const [workTreeName, setWorkTreeName] = useState("");

  async function addWorktree() {
    await invoke("add_worktree", {
      repoPath: props.repoPath,
      worktreeName: workTreeName,
    });
    setIsEnteringNewWorktree(false);
    setWorkTreeName("");
    await queryClient.invalidateQueries({ queryKey: ["repos"] });
  }

  if (!isEnteringNewWorktree) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEnteringNewWorktree(true)}
      >
        <PlusIcon /> Add Worktree
      </Button>
    );
  } else {
    return (
      <div className="flex w-full items-center gap-2">
        <Input
          placeholder="Worktree Name"
          autoCorrect="off"
          value={workTreeName}
          onChange={(e) => setWorkTreeName(e.target.value)}
        />
        <Button onClick={addWorktree}>Submit</Button>
        <Button
          variant="destructive"
          onClick={() => {
            setIsEnteringNewWorktree(false);
            setWorkTreeName("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }
}
