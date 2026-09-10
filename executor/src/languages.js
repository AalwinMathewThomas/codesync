const LANGUAGES = {
  javascript: {
    image: 'node:20-alpine',
    filename: 'solution.js',
    cmd: (filename) => [
      'sh',
      '-c',
      `cat stdin.txt | node ${filename}`
    ]
  },

  python: {
    image: 'python:3.11-alpine',
    filename: 'solution.py',
    cmd: (filename) => [
      'sh',
      '-c',
      `cat stdin.txt | python3 ${filename}`
    ]
  },

  cpp: {
    image: 'gcc:latest',
    filename: 'solution.cpp',
    cmd: (filename) => [
      'sh',
      '-c',
      `g++ -o solution ${filename} && cat stdin.txt | ./solution`
    ]
  },

  java: {
    image: 'eclipse-temurin:17-alpine',
    filename: 'Solution.java',
    cmd: (filename) => [
      'sh',
      '-c',
      `javac ${filename} && cat stdin.txt | java Solution`
    ]
  }
};

module.exports = LANGUAGES;