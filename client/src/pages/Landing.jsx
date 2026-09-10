import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Real-time collaborative coding
        </div>

        <h1 className="hero-title">
          Code Together,<br />
          <span className="gradient-text">Build Faster</span>
        </h1>

        <p className="hero-subtitle">
          A professional collaborative code editor with real-time
          sync, multi-language execution, and interview-ready rooms.
          No setup required.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary btn-lg">
            Start Coding Free
          </Link>
          <Link to="/about" className="btn-outline btn-lg">
            View Portfolio
          </Link>
        </div>

        {/* Fake editor preview */}
        <div className="hero-editor">
          <div className="editor-topbar">
            <div className="editor-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="editor-filename">solution.py</span>
            <div className="editor-users">
              <span className="user-dot" style={{background:'#7c3aed'}}>A</span>
              <span className="user-dot" style={{background:'#10b981'}}>B</span>
              <span className="user-dot" style={{background:'#f59e0b'}}>C</span>
            </div>
          </div>
          <div className="editor-body">
            <pre className="code-preview">
{`<span class="code-keyword">def</span> <span class="code-fn">two_sum</span>(nums, target):
    seen = {}
    <span class="code-keyword">for</span> i, num <span class="code-keyword">in</span> <span class="code-fn">enumerate</span>(nums):
        complement = target - num
        <span class="code-keyword">if</span> complement <span class="code-keyword">in</span> seen:
            <span class="code-keyword">return</span> [seen[complement], i]
        seen[num] = i`}
            </pre>
            <div className="editor-output">
              <span className="output-label">▶ Output</span>
              <span className="output-text success">[0, 1]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">
          Everything you need to code together
        </h2>

        <div className="features-grid">
          {[
            {
              icon: '⚡',
              title: 'Real-time Sync',
              desc: 'Every keystroke synced instantly across all users via Socket.IO. No lag, no conflicts.'
            },
            {
              icon: '🔒',
              title: 'Secure Rooms',
              desc: 'JWT auth, role-based access (Owner/Editor/Viewer), and lockable rooms.'
            },
            {
              icon: '▶',
              title: 'Live Execution',
              desc: 'Run Python, JavaScript, C++, and Java in isolated Docker sandboxes.'
            },
            {
              icon: '🎯',
              title: 'Interview Ready',
              desc: 'Share a room code with your candidate and start the interview instantly.'
            },
            {
              icon: '💬',
              title: 'Built-in Chat',
              desc: 'Discuss code without leaving the editor. Real-time chat in every room.'
            },
            {
              icon: '🌐',
              title: 'Multi-language',
              desc: 'Switch languages on the fly. Monaco editor with full syntax highlighting.'
            }
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2 className="section-title">Up and running in seconds</h2>
        <div className="steps">
          {[
            { n: '01', title: 'Create a room', desc: 'Sign up and create a room in one click. Choose your language.' },
            { n: '02', title: 'Share the code', desc: 'Share the 6-character room code with anyone you want to collaborate with.' },
            { n: '03', title: 'Code together', desc: 'Edit in real time, run code, chat, and ship faster.' }
          ].map((s, i) => (
            <div key={i} className="step">
              <span className="step-number">{s.n}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">Ready to collaborate?</h2>
        <p className="cta-sub">
          Join and start coding with your team in seconds.
        </p>
        <Link to="/register" className="btn-primary btn-lg">
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-logo">{'</>'} CodeSync</span>
        <div className="footer-links">
          <Link to="/about">About & Portfolio</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <span className="footer-copy">
          Built by Aalwin Mathew Thomas
        </span>
      </footer>
    </div>
  );
};

export default Landing;