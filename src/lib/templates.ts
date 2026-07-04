export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  color: string;
  files: { name: string; content: string }[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "blank",
    name: "Start from Scratch",
    description: "Empty files, ready for anything",
    language: "javascript",
    icon: "📄",
    color: "#8b949e",
    files: [{ name: "index.js", content: "" }],
  },
  {
    id: "hello-js",
    name: "Hello World (JavaScript)",
    description: "Simple console log starter",
    language: "javascript",
    icon: "🟨",
    color: "#f7df1e",
    files: [
      {
        name: "index.js",
        content: `console.log('Hello, World!');`,
      },
    ],
  },
  {
    id: "hello-python",
    name: "Hello World (Python)",
    description: "Simple print statement starter",
    language: "python",
    icon: "🐍",
    color: "#3572a5",
    files: [
      {
        name: "main.py",
        content: `print("Hello, World!")`,
      },
    ],
  },
  {
    id: "react-component",
    name: "React Component",
    description: "Functional component with styles",
    language: "javascript",
    icon: "⚛️",
    color: "#61dafb",
    files: [
      {
        name: "index.jsx",
        content: `import React from 'react';
import './styles.css';

function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="app">
      <h1>React Component</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;
`,
      },
      {
        name: "styles.css",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.app {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #238636;
}

p {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  border: 1px solid #30363d;
  border-radius: 6px;
  background: #238636;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #2ea043;
}
`,
      },
    ],
  },
  {
    id: "express-api",
    name: "Express API",
    description: "Basic REST server with routes",
    language: "javascript",
    icon: "🚀",
    color: "#68a063",
    files: [
      {
        name: "index.js",
        content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory data store
let items = [];

// GET all items
app.get('/api/items', (req, res) => {
  res.json({ items, count: items.length });
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// POST create item
app.post('/api/items', (req, res) => {
  const item = {
    id: items.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  res.status(201).json(item);
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  items[index] = { ...items[index], ...req.body };
  res.json(items[index]);
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  items.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`,
      },
      {
        name: "package.json",
        content: `{
  "name": "express-api",
  "version": "1.0.0",
  "description": "A basic Express API server",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
`,
      },
    ],
  },
  {
    id: "html-css",
    name: "HTML/CSS Page",
    description: "Starter webpage with styles",
    language: "html",
    icon: "🌐",
    color: "#e34c26",
    files: [
      {
        name: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <h1>My Website</h1>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h2>Welcome to My Page</h2>
      <p>Start building something amazing today.</p>
      <a href="#" class="btn">Get Started</a>
    </section>
  </main>

  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
</body>
</html>
`,
      },
      {
        name: "styles.css",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0d1117;
  color: #e6edf3;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #161b22;
  border-bottom: 1px solid #30363d;
  padding: 1rem 2rem;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav h1 {
  color: #238636;
  font-size: 1.5rem;
}

nav ul {
  list-style: none;
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: #8b949e;
  text-decoration: none;
  transition: color 0.2s;
}

nav a:hover {
  color: #e6edf3;
}

.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  color: #8b949e;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #238636;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn:hover {
  background: #2ea043;
}

footer {
  text-align: center;
  padding: 1.5rem;
  border-top: 1px solid #30363d;
  color: #8b949e;
  font-size: 0.875rem;
}
`,
      },
    ],
  },
  {
    id: "typescript-app",
    name: "TypeScript App",
    description: "Interfaces, classes, and types",
    language: "typescript",
    icon: "🔷",
    color: "#3178c6",
    files: [
      {
        name: "index.ts",
        content: `interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

class UserService {
  private users: User[] = [];

  addUser(user: Omit<User, "id">): User {
    const newUser: User = {
      ...user,
      id: this.users.length + 1,
    };
    this.users.push(newUser);
    return newUser;
  }

  getUser(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  listUsers(): User[] {
    return [...this.users];
  }

  filterByRole(role: User["role"]): User[] {
    return this.users.filter((u) => u.role === role);
  }
}

// Usage
const service = new UserService();

service.addUser({ name: "Alice", email: "alice@example.com", role: "admin" });
service.addUser({ name: "Bob", email: "bob@example.com", role: "editor" });
service.addUser({ name: "Charlie", email: "charlie@example.com", role: "viewer" });

console.log("All users:", service.listUsers());
console.log("Admins:", service.filterByRole("admin"));
console.log("User #1:", service.getUser(1));
`,
      },
    ],
  },
  {
    id: "sql-schema",
    name: "SQL Schema",
    description: "Sample users table with relations",
    language: "sql",
    icon: "🗃️",
    color: "#e38c00",
    files: [
      {
        name: "schema.sql",
        content: `-- Users table
CREATE TABLE users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT    NOT NULL UNIQUE,
  email     TEXT    NOT NULL UNIQUE,
  password  TEXT    NOT NULL,
  avatar    TEXT,
  role      TEXT    NOT NULL DEFAULT 'viewer'
           CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL,
  title     TEXT    NOT NULL,
  body      TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE comments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id   INTEGER NOT NULL,
  user_id   INTEGER NOT NULL,
  body      TEXT    NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Sample data
INSERT INTO users (username, email, password, role) VALUES
  ('alice', 'alice@example.com', 'hashed_pw', 'admin'),
  ('bob', 'bob@example.com', 'hashed_pw', 'editor');
`,
      },
    ],
  },
  {
    id: "rust-program",
    name: "Rust Program",
    description: "Basic fn main with structs",
    language: "rust",
    icon: "🦀",
    color: "#dea584",
    files: [
      {
        name: "main.rs",
        content: `struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn new(width: u32, height: u32) -> Self {
        Rectangle { width, height }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn is_square(&self) -> bool {
        self.width == self.height
    }

    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut rect = Rectangle::new(10, 20);

    println!("Rectangle: {}x{}", rect.width, rect.height);
    println!("Area: {}", rect.area());
    println!("Is square: {}", rect.is_square());

    rect.scale(2);
    println!("Scaled: {}x{}", rect.width, rect.height);
    println!("New area: {}", rect.area());

    // Using a vector
    let shapes: Vec<Rectangle> = vec![
        Rectangle::new(5, 5),
        Rectangle::new(3, 8),
        Rectangle::new(10, 10),
    ];

    println!("\\nAll shapes:");
    for (i, shape) in shapes.iter().enumerate() {
        println!(
            "  {}: {}x{} (area={}, square={})",
            i + 1,
            shape.width,
            shape.height,
            shape.area(),
            shape.is_square()
        );
    }
}
`,
      },
    ],
  },
  {
    id: "go-http",
    name: "Go HTTP Server",
    description: "HTTP handler with routing",
    language: "go",
    icon: "🐹",
    color: "#00add8",
    files: [
      {
        name: "main.go",
        content: `package main

import (
\t"encoding/json"
\t"fmt"
\t"log"
\t"net/http"
\t"strconv"
\t"sync"
)

type Item struct {
\tID   int    \`json:"id"\`
\tName string \`json:"name"\`
\tDone bool   \`json:"done"\`
}

var (
\titems  []Item
\tmu     sync.Mutex
\tnextID = 1
)

func main() {
\tmux := http.NewServeMux()

\tmux.HandleFunc("GET /api/items", getItems)
\tmux.HandleFunc("POST /api/items", createItem)
\tmux.HandleFunc("GET /api/items/{id}", getItem)
\tmux.HandleFunc("DELETE /api/items/{id}", deleteItem)

\taddr := ":8080"
\tfmt.Printf("Server running on http://localhost%s\\n", addr)
\tlog.Fatal(http.ListenAndServe(addr, mux))
}

func getItems(w http.ResponseWriter, r *http.Request) {
\tmu.Lock()
\tdefer mu.Unlock()
\tjson.NewEncoder(w).Encode(items)
}

func createItem(w http.ResponseWriter, r *http.Request) {
\tmu.Lock()
\tdefer mu.Unlock()

\tvar item Item
\tif err := json.NewDecoder(r.Body).Decode(&item); err != nil {
\t\thttp.Error(w, "Invalid request body", http.StatusBadRequest)
\t\treturn
\t}

\titem.ID = nextID
\tnextID++
\titems = append(items, item)

\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(http.StatusCreated)
\tjson.NewEncoder(w).Encode(item)
}

func getItem(w http.ResponseWriter, r *http.Request) {
\tmu.Lock()
\tdefer mu.Unlock()

\tid, err := strconv.Atoi(r.PathValue("id"))
\tif err != nil {
\t\thttp.Error(w, "Invalid ID", http.StatusBadRequest)
\t\treturn
\t}

\tfor _, item := range items {
\t\tif item.ID == id {
\t\t\tjson.NewEncoder(w).Encode(item)
\t\t\treturn
\t\t}
\t}

\thttp.Error(w, "Item not found", http.StatusNotFound)
}

func deleteItem(w http.ResponseWriter, r *http.Request) {
\tmu.Lock()
\tdefer mu.Unlock()

\tid, err := strconv.Atoi(r.PathValue("id"))
\tif err != nil {
\t\thttp.Error(w, "Invalid ID", http.StatusBadRequest)
\t\treturn
\t}

\tfor i, item := range items {
\t\tif item.ID == id {
\t\t\titems = append(items[:i], items[i+1:]...)
\t\t\tw.WriteHeader(http.StatusNoContent)
\t\t\treturn
\t\t}
\t}

\thttp.Error(w, "Item not found", http.StatusNotFound)
}
`,
      },
    ],
  },
];