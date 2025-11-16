import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';
import { useQuery } from '@tanstack/react-query';

interface Repository {
    path: string;
    name: string;
}

function App() {
    const [greetMsg, setGreetMsg] = useState('');
    const [name, setName] = useState('');

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await invoke('greet', { name }));
    }

    const { data, isPending, error } = useQuery<Repository[]>({
        queryKey: ['repos'],
        queryFn: () => invoke('get_repos'),
    });

    if (isPending) {
        return <span>Loading...</span>;
    }

    if (error) {
        return <span>Error: {(error as Error).message}</span>;
    }

    console.log(data);

    return (
        <main className="container">
            {data.map((repo) => (
                <div key={repo.path}>
                    <h2>{repo.name}</h2>
                </div>
            ))}
            <form
                className="row"
                onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                }}
            >
                <input
                    id="greet-input"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <button type="submit">Greet</button>
            </form>
            <p>{greetMsg}</p>
        </main>
    );
}

export default App;
