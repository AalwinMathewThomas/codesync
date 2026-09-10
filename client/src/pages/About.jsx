import Navbar from '../components/Navbar';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <Navbar />

      <div className="about-content">

        {/* Hero */}
        <div className="about-hero animate-fadeIn">
          <div className="about-avatar">AM</div>

          <h1 className="about-name">Aalwin Mathew</h1>

          <p className="about-title">
            Aspiring to get a JOB
          </p>

          <p className="about-school">
            B.Tech CSE · NIT Patna · 2027
          </p>

          <div className="about-links">
            <a
              href="https://github.com/AalwinMathewThomas"
              target="_blank"
              rel="noreferrer"
              className="about-link"
            >
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/aalwin-mathew-thomas/"
              target="_blank"
              rel="noreferrer"
              className="about-link"
            >
              LinkedIn
            </a>

            <a
              href="mailto:aalwin.mathew.thomas@gmail.com"
              className="about-link"
            >
              Email
            </a>
          </div>
        </div>

        {/* Skills */}
        <section className="about-section animate-fadeIn">
          <h2 className="about-section-title">Technical Skills</h2>

          <div className="skills-grid">
            {[
              {
                cat: 'Backend',
                items: ['Node.js', 'Express', 'Flask', 'REST APIs']
              },
              {
                cat: 'Frontend',
                items: ['HTML','React', 'Vite', 'CSS', 'Monaco Editor']
              },
              {
                cat: 'Databases',
                items: ['MongoDB', 'Redis', 'Mongoose']
              },
              {
                cat: 'DevOps',
                items: ['Docker', 'Nginx', 'docker-compose']
              },
              {
                cat: 'Real-time',
                items: ['Socket.IO', 'WebSockets', 'SSE']
              },
              {
                cat: 'Auth',
                items: ['JWT', 'bcrypt', 'httpOnly Cookies']
              },
              {
                cat: 'Languages',
                items: ['JavaScript', 'Python', 'C++', 'Java']
              },
              {
                cat: 'Tools',
                items: ['Git', 'VS Code', 'Postman']
              }
            ].map((s) => (
              <div key={s.cat} className="skill-card">
                <h3 className="skill-cat">{s.cat}</h3>

                <div className="skill-tags">
                  {s.items.map((item) => (
                    <span key={item} className="skill-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
