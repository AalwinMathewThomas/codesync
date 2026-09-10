const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const LANGUAGES = require('./languages');

const docker = new Docker();

const runCode = async (language, code, stdin = '') => {
  const langConfig = LANGUAGES[language];

  if (!langConfig) {
    return {
      success: false,
      output: '',
      error: `Unsupported language: ${language}`,
      executionTime: 0
    };
  }

  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'codesync-')
  );

  const filePath = path.join(
    tempDir,
    langConfig.filename
  );

  fs.writeFileSync(filePath, code);

  const stdinPath = path.join(tempDir, 'stdin.txt');
  fs.writeFileSync(stdinPath, stdin);

  const startTime = Date.now();
  let container;

  try {
    await pullImageIfNeeded(langConfig.image);

    container = await docker.createContainer({
      Image: langConfig.image,
      Cmd: langConfig.cmd(langConfig.filename),
      WorkingDir: '/code',

      HostConfig: {
        Binds: [`${tempDir}:/code`],
        Memory: 128 * 1024 * 1024,
        MemorySwap: 128 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        NetworkMode: 'none',
        AutoRemove: false
      },

      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    await container.start();

    const timeout =
      parseInt(process.env.EXECUTION_TIMEOUT) || 10000;

    await Promise.race([
      container.wait(),

      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Execution timed out')),
          timeout
        )
      )
    ]);

    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: false
    });

    let stdout = '';
    let stderr = '';

    let offset = 0;

    const buffer = Buffer.isBuffer(logStream)
      ? logStream
      : Buffer.from(logStream);

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) {
        break;
      }

      const streamType = buffer[offset];
      const size = buffer.readUInt32BE(offset + 4);

      offset += 8;

      if (offset + size > buffer.length) {
        break;
      }

      const chunk = buffer
        .slice(offset, offset + size)
        .toString();

      offset += size;

      if (streamType === 1) {
        stdout += chunk;
      } else if (streamType === 2) {
        stderr += chunk;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      output: stdout.trim(),
      error: stderr.trim(),
      executionTime
    };

  } catch (error) {

    if (
      container &&
      error.message === 'Execution timed out'
    ) {
      try {
        await container.kill();
      } catch (killError) {
        // Ignore kill errors
      }
    }

    return {
      success: false,
      output: '',
      error:
        error.message === 'Execution timed out'
          ? `Execution timed out after ${
              process.env.EXECUTION_TIMEOUT / 1000
            } seconds`
          : error.message,
      executionTime: Date.now() - startTime
    };

  } finally {

    try {
      fs.rmSync(tempDir, {
        recursive: true,
        force: true
      });
    } catch (e) {
      // Ignore cleanup errors
    }

    if (container) {
      try {
        await container.remove({
          force: true
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
};

const pullImageIfNeeded = (image) => {
  return new Promise((resolve, reject) => {

    docker.pull(image, (err, stream) => {

      if (err) {
        return reject(err);
      }

      docker.modem.followProgress(
        stream,
        (err) => {

          if (err) {
            return reject(err);
          }

          resolve();
        }
      );
    });
  });
};

module.exports = { runCode };