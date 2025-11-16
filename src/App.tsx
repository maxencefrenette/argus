import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

function App() {
    const [greetMsg, setGreetMsg] = useState('');
    const [name, setName] = useState('');

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await invoke('greet', { name }));
    }

    const repos = [
        {
            path: '/Users/maxence/Repos/srs-benchmark',
            name: 'srs-benchmark',
        },
        {
            path: '/Users/maxence/Repos/heisenbase',
            name: 'heisenbase',
        },
    ];

    return (
        <main className="container">
            {repos.map((repo) => (
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
